from ..gigachat.llm import get_llm
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder


PROMT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """Твоя задача - составить пользователю roadmap изучения указанной им темы/направления.
            Посоветуй, что и в каком порядке ему следует изучить, чтобы полностью разобраться в теме.
            Ответ пиши в формате списка. Составляй список в порядке возрастающей сложности. Следующие
            шаги должны опираться на знания из предыдущих. Для каждого пункта добавь 2-3 предложения, 
            где описываются, что входит в эту тему. Ни в коем случае не делай список длиннее 7 пунктов.
            Структура ответа: 
            1. Что изучить
                Состав программы
            2. Что изучить
                Состав программы
            
            Пример 1:
            Тема - Data Science
            Ответ:
            1. Теория вероятностей и описательная статистика
                категориальные и числовые данные, среднее значение, мода и медиана
                стандартное отклонение и дисперсия, ковариация, корреляция, асимметрия
                комбинаторика, события и их вероятности, классическая вероятность, условная вероятность
                формулы Байеса, Пуассона и Бернулли, локальная и интегральная теоремы Лапласа
                дискретные случайные величины, дискретные распределения (геометрическое, биномиальное, Пуассона)
                непрерывные случайные величины, непрерывные распределения (равномерное, показательное, нормальное)
                
            2. Языки программирования Python​
                типы данных: числа, строки, списки, множества, кортежи, циклы while и for, условия,
                их комбинации, функции, область видимости, lambda, рекурсия, декораторы, генераторы,
                вычислительная сложность, операции над структурами данных, стандартная библиотека,
                работа с ошибками и исключениями, try-except, raise, assert, работа с файлами: чтение,
                запись, сериализация, концепции ООП: полиморфизм, наследование, инкапсуляция
                
            3. Разные библиотеки, инструменты и техники Python для Data Science​
                pandas, numpy, scipy, matplotlib, scikit-learn, tensorflow
                
            ​4. SQL и базы данных​
                базовые концепции: таблицы, столбцы, строки и типы данных
                создание простых SELECT-запросов
                фильтрация с помощью WHERE и LIKE
                агрегирующие функции: COUNT, SUM, AVG, MAX/MIN
                группировка с помощью GROUP BY, HAVING
                объединение таблиц через JOIN
                CREATE TABLE для создания новых таблиц
                ALTER TABLE, DROP TABLE для изменения и удаления
                INSERT, UPDATE для добавления, изменения строк в таблице
                DELETE для удаления строк
                концепции базы данных (первичные и внешние ключи)
                создание новой БД при помощи CREATE DATABASE

            5. Машинное обучение​
                классическое обучение (регрессия, классификация, кластеризация,
                поиск правил, уменьшение размерности), ансамблевые методы ( стекинг,
                беггинг, бустинг), обучение с подрекплением, нейросети и глубокое обучение

            Пример 2:
            Тема - алгоритмы
            Ответ:
            1. Списки и хеширование
            2. Два указателя / Стек
            3. Бинарный поиск / Скользящее окно / Связанные листы
            4. Деревья
            5. Нагруженные деревья / Бектрекинг
            6. Куча / Графы / Одноразмерное динамическое программирование
            7. Интервалы / Жадный алгоритм / Двухразмерное динамическое программирование\n
            манипуляции с битами / Продвинутые графы 
            """,
        ),
        MessagesPlaceholder(variable_name="messages"),
    ]
)


def _create_roadmap(topic):
    chain = PROMT | get_llm()
    roadmap = chain.invoke(
        {
            "messages": [
                HumanMessage(content=topic),
            ],
        }
    ).content
    return roadmap


def _create_sctructure(roadmap):
    structure = {}
    note_num = [int(i) for i in roadmap if i.isdigit()]
    roadmap = "\n".join([line.strip() for line in roadmap.replace(":", "").splitlines()])
    for i in note_num[1:]:
        split_id = roadmap.index(str(i))  # находим индекс номера пункта
        batch = roadmap[:split_id].splitlines()  # отделяем первый пукт
        structure[batch[0]] = (
            "<br />" + "<br />".join(batch[1:]).strip()
        )  # словарь header - пункт
        roadmap = roadmap[split_id:]

    structure[roadmap.splitlines()[0]] = roadmap  # добавляем последний пункт

    keys = list(structure.keys())
    for i in range(len(keys) - 1):
        structure[keys[i]] += (
            "<br /><br />Следующий этап: [[" + list(structure.keys())[i + 1] + "]]"
        )

    for k, v in structure.items():
        structure[k] = v.replace("\n", "<br />")

    return structure


def process_roadmap(topic):
    roadmap = _create_roadmap(topic)
    return _create_sctructure(roadmap)
