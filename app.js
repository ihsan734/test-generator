// Сохраняем выборы пользователя
let userChoices = {
    educationLevel: '',
    subject: '',
    topic: ''
};

// Предметы для школы
const schoolSubjects = [
    "Математика", "Физика", "История", "Биология", "Химия", "Литература", "Английский язык"
];

// Специальности для университета
const universitySubjects = [
    "Информационные технологии", "Бизнес", "Юриспруденция", "Экономика", "Инженерия", "Медицина"
];

// Темы по предметам
const themesBySubject = {
    "Математика": ["Теорема Пифагора", "Логарифмы", "Статистика"],
    "Физика": ["Законы Ньютона", "Термодинамика", "Оптика"],
    "История": ["Вторая мировая война", "Великая депрессия", "История Казахстана"],
    "Биология": ["Клеточная структура", "Генетика", "Экология"],
    "Химия": ["Органическая химия", "Кислотно-основные реакции", "Периодическая таблица"],
    "Литература": ["Анализ поэзии", "Русская классика", "Современная литература"],
    "Английский язык": ["Грамматика", "Чтение и перевод", "Аудирование"],
    "Информационные технологии": ["Базы данных", "Структуры данных", "Кибербезопасность"],
    "Бизнес": ["Маркетинг", "Управление проектами", "Финансовый анализ"],
    "Юриспруденция": ["Конституционное право", "Гражданское право", "Уголовное право"],
    "Экономика": ["Микроэкономика", "Макроэкономика", "Теория игр"],
    "Инженерия": ["Теория механизмов", "Статика", "Термодинамика"],
    "Медицина": ["Анатомия", "Патология", "Педиатрия"]
};

function goToSettings() {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('settings-page').style.display = 'block';
}

function selectEducation(level) {
    userChoices.educationLevel = level;
    document.getElementById('step-education').style.display = 'none';
    document.getElementById('step-subject').style.display = 'block';

    const subjectLabel = document.getElementById('subject-label');
    subjectLabel.innerText = (level === 'school') ? 'Выберите предмет:' : 'Выберите специальность:';

    const subjectOptions = document.getElementById('subject-options');
    subjectOptions.innerHTML = '';

    const subjects = (level === 'school') ? schoolSubjects : universitySubjects;

    subjects.forEach(subj => {
        const btn = document.createElement('button');
        btn.textContent = subj;
        btn.onclick = function () {
            selectReadySubject(subj);
        };
        subjectOptions.appendChild(btn);
    });
}

function selectReadySubject(subj) {
    document.getElementById('custom-subject').value = subj;
    confirmSubject();
}

function confirmSubject() {
    const customSubject = document.getElementById('custom-subject').value.trim();
    if (customSubject === '') {
        alert('Пожалуйста, выберите или введите предмет/специальность.');
        return;
    }
    userChoices.subject = customSubject;

    document.getElementById('step-subject').style.display = 'none';
    document.getElementById('step-topic').style.display = 'block';

    showThemes(customSubject);
}

function showThemes(subject) {
    const themeOptions = document.getElementById('theme-options');
    themeOptions.innerHTML = '';

    const themes = themesBySubject[subject] || [];

    themes.forEach(theme => {
        const btn = document.createElement('button');
        btn.textContent = theme;
        btn.onclick = function () {
            selectReadyTopic(theme);
        };
        themeOptions.appendChild(btn);
    });
}

function selectReadyTopic(theme) {
    userChoices.topic = theme;

    document.getElementById('step-topic').style.display = 'none';
    document.getElementById('step-settings').style.display = 'block';
}

function confirmTopic() {
    const topic = document.getElementById('topic').value.trim();
    if (topic === '') {
        alert('Пожалуйста, введите тему.');
        return;
    }
    userChoices.topic = topic;

    document.getElementById('step-topic').style.display = 'none';
    document.getElementById('step-settings').style.display = 'block';
}

async function generateTest() {
    const difficulty = document.getElementById('difficulty').value;
    const questionCount = parseInt(document.getElementById('question-count').value);
    const answerCount = parseInt(document.getElementById('answer-options').value);
    const testContainer = document.getElementById('test-container');

    const maxCorrectAnswers = { 5: 1, 6: 2, 7: 3 }[answerCount] || 1;

    document.getElementById('settings-page').style.display = 'none';
    document.getElementById('test-page').style.display = 'block';

    testContainer.innerHTML = "<p>Генерация теста... Пожалуйста, подождите</p>";

    try {
        const response = await fetch('http://localhost:5000/generate-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject: userChoices.subject,
                topic: userChoices.topic,
                difficulty: difficulty,
                educationLevel: userChoices.educationLevel,
                count: questionCount,
                answer_count: answerCount
            })
        });

        const data = await response.json();

        if (data.result) {
            const questions = JSON.parse(data.result);
            testContainer.innerHTML = '';

            questions.forEach((q, index) => {
                const qDiv = document.createElement('div');
                qDiv.className = 'question-block';
                qDiv.innerHTML = `
                    <p><strong>${index + 1}. ${q.question}</strong></p>
                    ${q.options.map((opt, i) => `
                        <label><input type="checkbox" data-qindex="${index}" data-max="${maxCorrectAnswers}" name="q${index}" value="${opt}"> ${opt}</label><br>`).join('')}
                `;
                testContainer.appendChild(qDiv);
            });

            document.querySelectorAll('input[type="checkbox"]').forEach(input => {
                input.addEventListener('change', (e) => {
                    const current = e.target;
                    const group = document.querySelectorAll(`input[name="${current.name}"]`);
                    const max = parseInt(current.dataset.max);
                    const checked = Array.from(group).filter(i => i.checked);
                    if (checked.length > max) {
                        current.checked = false;
                        alert(`Можно выбрать только ${max} вариант(а/ов)`);
                    }
                });
            });

            window.correctAnswers = questions.map(q => q.correct_answers);
        } else {
            testContainer.innerHTML = `<p>Ошибка при генерации: ${data.error || 'неизвестно'}</p>`;
        }
    } catch (error) {
        testContainer.innerHTML = `<p>Ошибка подключения к серверу</p>`;
        console.error(error);
    }
}

function submitTest() {
    const answers = window.correctAnswers || [];
    let score = 0;

    answers.forEach((correctList, index) => {
        const selected = Array.from(document.querySelectorAll(`input[name="q${index}"]:checked`)).map(el => el.value);
        const correctSet = new Set(correctList);
        const selectedSet = new Set(selected);

        if (correctSet.size === selectedSet.size && [...correctSet].every(v => selectedSet.has(v))) {
            score++;
        }
    });

    document.getElementById('test-page').style.display = 'none';
    document.getElementById('result-page').style.display = 'block';
    document.getElementById('score').innerText = `Ваш результат: ${score} из ${answers.length}`;
}

function restart() {
    document.getElementById('result-page').style.display = 'none';
    document.getElementById('test-page').style.display = 'none';
    document.getElementById('settings-page').style.display = 'none';

    userChoices = { educationLevel: '', subject: '', topic: '' };

    document.getElementById('home-page').style.display = 'block';
    document.getElementById('step-education').style.display = 'block';
    document.getElementById('step-subject').style.display = 'none';
    document.getElementById('step-topic').style.display = 'none';
    document.getElementById('step-settings').style.display = 'none';

    document.getElementById('custom-subject').value = '';
    document.getElementById('topic').value = '';
    document.getElementById('subject-options').innerHTML = '';
    document.getElementById('theme-options').innerHTML = '';
}

function scrollToSettings() {
    const settingsSection = document.getElementById('settings-page');
    settingsSection.style.display = 'block';
    document.getElementById('home-page').style.display = 'none';

    window.scrollTo({ top: settingsSection.offsetTop - 50, behavior: 'smooth' });
}

// Функции для возврата
function backToEducation() {
    document.getElementById('step-subject').style.display = 'none';
    document.getElementById('step-education').style.display = 'block';
}

function backToSubject() {
    document.getElementById('step-topic').style.display = 'none';
    document.getElementById('step-subject').style.display = 'block';
}

function backToTopic() {
    document.getElementById('step-settings').style.display = 'none';
    document.getElementById('step-topic').style.display = 'block';
}
