import asyncio
import httpx
from telegram import Bot
from telegram.request import HTTPXRequest

async def main():
    text = open("bot.py").read()
    token = text.split('BOT_TOKEN = "')[1].split('"')[0]

    request = HTTPXRequest(
        connect_timeout=30,
        read_timeout=30,
        write_timeout=30,
        pool_timeout=30
    )

    bot = Bot(token=token, request=request)

    me = await bot.get_me()
    print(me)

asyncio.run(main())
