const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

const result = document.getElementById("result");
const playersBox = document.getElementById("players");
const dice = document.getElementById("dice");
const rollButton = document.getElementById("rollButton");
const inviteButton = document.getElementById("inviteButton");

const params = new URLSearchParams(location.search);
let roomId = params.get("room");

if (!roomId) {
    roomId = Math.random().toString(36).substring(2,8).toUpperCase();
    history.replaceState(null,"","?room="+roomId);
}

const tgUser = tg?.initDataUnsafe?.user;

const savedId =
    sessionStorage.getItem("dice_player_id") ||
    "guest-"+Math.random().toString(36).substring(2,12);

sessionStorage.setItem("dice_player_id",savedId);

const me = {
    id:String(tgUser?.id || savedId),
    name:tgUser?.first_name || tgUser?.username || "مهمان"
};

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let room = null;
let busy = false;

function players(){
    return Array.isArray(room?.players) ? room.players : [];
}

function total(p){
    const rolls = Array.isArray(p?.rolls)
        ? p.rolls.slice(0, 3)
        : [];

    return rolls.reduce((sum, n) => {
        const v = Number(n);
        return sum + (Number.isInteger(v) && v >= 1 && v <= 6 ? v : 0);
    }, 0);
}

function render(){
    const list=players();

    playersBox.innerHTML=list.map((p,i)=>`
        <div>
        ${i+1}. ${p.name} — 🎲 ${(p.rolls||[]).length}/3
        — 🏆 ${total(p)}
        </div>
    `).join("");

    const mine=list.find(p=>String(p.id)===String(me.id));
    const myRolls=mine?.rolls || [];

    if(list.length<2){
        result.textContent=
            "🎲 اتاق آماده است\n\n"+
            "منتظر بازیکن دوم هستیم.";
        rollButton.disabled=true;
        return;
    }

    if(list.some(p=>(p.rolls||[]).length<3)){
        const turnIndex=
            list.findIndex(p=>(p.rolls||[]).length===Math.min(
                ...list.map(x=>(x.rolls||[]).length)
            ));

        if(String(list[turnIndex]?.id)===String(me.id)){
            result.textContent="🎯 نوبت توست!";
            rollButton.disabled=myRolls.length>=3;
        }else{
            result.textContent=
                "⏳ نوبت بازیکن دیگر است...";
            rollButton.disabled=true;
        }
        return;
    }

    const scores=list.map(total);
    const max=Math.max(...scores);
    const winners=list.filter(p=>total(p)===max);

    if(winners.length===1){
        result.textContent=
            "🏆 برنده: "+winners[0].name+
            "\n🎉 مجموع: "+max;
    }else{
        result.textContent=
            "🤝 مساوی!\n🏆 مجموع: "+max;
    }

    rollButton.disabled=true;
}

async function loadRoom(){
    const {data,error}=await supabaseClient
        .from("game_rooms")
        .select("id,room_id,players,status")
        .eq("room_id",roomId)
        .maybeSingle();

    if(error){
        result.textContent="❌ "+error.message;
        return;
    }

    if(!data){
        const {data:created,error:createError}=
            await supabaseClient
            .from("game_rooms")
            .insert({
                room_id:roomId,
                players:[{...me,rolls:[]}],
                status:"waiting"
            })
            .select("id,room_id,players,status")
            .single();

        if(createError){
            result.textContent="❌ "+createError.message;
            return;
        }

        room=created;
        render();
        return;
    }

    room=data;

    const list=players();

    if(!list.some(p=>String(p.id)===String(me.id))){
        if(list.length>=2){
            result.textContent="❌ این اتاق پر است.";
            rollButton.disabled=true;
            return;
        }

        list.push({...me,rolls:[]});

        const {data:updated,error:updateError}=
            await supabaseClient
            .from("game_rooms")
            .update({
                players:list,
                status:"playing"
            })
            .eq("room_id",roomId)
            .select("id,room_id,players,status")
            .single();

        if(updateError){
            result.textContent="❌ "+updateError.message;
            return;
        }

        room=updated;
    }

    render();
}

async function rollDice(){
    if(busy || !room)return;

    busy=true;

    const list=players();
    const index=list.findIndex(
        p=>String(p.id)===String(me.id)
    );

    if(index===-1){
        busy=false;
        return;
    }

    const myRolls=list[index].rolls || [];

    if(myRolls.length>=3){
        busy=false;
        return;
    }

    const minimum=Math.min(
        ...list.map(p=>(p.rolls||[]).length)
    );

    if(myRolls.length!==minimum){
        busy=false;
        return;
    }

    const value=Math.floor(Math.random()*6)+1;

    dice.classList.remove("rolling");
    void dice.offsetWidth;
    dice.classList.add("rolling");

    await new Promise(resolve=>setTimeout(resolve,900));

    dice.textContent=["⚀","⚁","⚂","⚃","⚄","⚅"][value-1];

    list[index]={
        ...list[index],
        rolls:[...myRolls,value]
    };

    const {data,error}=await supabaseClient
        .from("game_rooms")
        .update({players:list,status:"playing"})
        .eq("room_id",roomId)
        .select("id,room_id,players,status")
        .single();

    if(error){
        result.textContent="❌ "+error.message;
        busy=false;
        return;
    }

    room=data;
    render();
    busy=false;
}

rollButton.addEventListener("click",rollDice);

inviteButton.addEventListener("click",()=>{
    const link=
        location.origin+
        location.pathname+
        "?room="+roomId;

    const share=
        "https://t.me/share/url?url="+
        encodeURIComponent(link)+
        "&text="+
        encodeURIComponent("🎲 بیا بازی تاس دونفره!");

    if(tg?.openTelegramLink){
        tg.openTelegramLink(share);
    }else{
        location.href=share;
    }
});

supabaseClient
.channel("dice-room-"+roomId)
.on(
    "postgres_changes",
    {
        event:"*",
        schema:"public",
        table:"game_rooms",
        filter:"room_id=eq."+roomId
    },
    payload=>{
        if(payload.new){
            room=payload.new;
            render();
        }
    }
)
.subscribe();

loadRoom();
