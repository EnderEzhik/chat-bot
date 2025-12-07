def get_bot_answer(message: str) -> str:
    print(message)
    message = message.lower()
    print(message)
    if "привет" in message or "здравствуй" in message or "здравствуйте" in message:
        return "Привет! Я бот тех. поддержки солнца. Что я могу для тебя сделать?"
    elif "пока" in message:
        return "Пока!"
    else:
        return "Я тебя не понимаю"
