'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputTemp = document.querySelector('.form__input--temp');
const inputClimb = document.querySelector('.form__input--climb');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; //km
    this.duration = duration; //min
  }
  _setDescription() {
    this.type === 'running'
      ? (this.description = `Пробежка ${new Intl.DateTimeFormat('ru-Ru').format(
          this.date
        )}`)
      : (this.description = `${new Intl.DateTimeFormat('ru-Ru').format(
          this.date
        )}`);
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, temp) {
    super(coords, distance, duration);
    this.temp = temp;
    this.calculatePace();
    this._setDescription();
  }
  calculatePace() {
    //min/km
    this.pace = this.duration / this.distance;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, climb) {
    super(coords, distance, duration);
    this.climb = climb;
    this.calculateSpeed();
    this._setDescription();
  }
  calculateSpeed() {
    //km/hour
    this.speed = this.distance / this.duration / 60;
  }
}

// const running = new Running([50, 39], 7, 40, 170);
// const cycling = new Cycling([50, 39], 37, 30, 100);
// console.log(running, cycling);

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    //Полученме данных местоположения пользователя
    this._getPosition();

    //Получение данных из локального хранилища
    this._getLocalStorageData();

    // Добавление обработчиков события
    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleClimbField);

    containerWorkouts.addEventListener('click', this._moveToWorkout.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      // Получаем геопозицию
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Unable to get your location');
        }
      );
    }
  }
  _loadMap(position) {
    //console.log(position);

    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log('--------------');
    // console.log(position.coords);
    // console.log(latitude);
    // console.log(longitude);
    // console.log(
    //   `https://www.google.ru/maps/@${latitude},${longitude},12z?hl=ru`
    // );
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker(coords)
      .addTo(this.#map)
      .bindPopup('Hey, you are here now!')
      .openPopup();
    //До сюда вопросов нет++++++

    //Обработка клика на карте
    this.#map.on('click', this._showForm.bind(this));
    //Отображение тренировок из локального хранилища на карте
    this.#workouts.forEach(workout => {
      this._displayWorkout(workout);
    });
  }

  _showForm(e) {
    this.#mapEvent = e;
    // console.log('+_+_+_+_+_+_+_+');

    //console.log(this.#mapEvent);
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleClimbField() {
    inputClimb.closest('.form__row').classList.toggle('form__row--hidden');
    inputTemp.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _hideForm() {
    inputDistance.value =
      inputClimb.value =
      inputDuration.value =
      inputTemp.value =
        '';
    form.classList.add('hidden');
  }

  _newWorkout(e) {
    const areNumbers = (...numbers) =>
      numbers.every(num => Number.isFinite(num));

    const areNumbersPositive = (...numbers) =>
      numbers.every(num => Number(num) > 0);
    e.preventDefault();
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //Получить данные из формы
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    //Если тренировка является пробежкой, то создать объект Running
    if (type === 'running') {
      const temp = +inputTemp.value;
      //Проверка валидности данных
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(temp)
        !areNumbers(distance, duration, temp) ||
        !areNumbersPositive(distance, duration, temp)
      )
        return alert(`Please enter positive number`);
      workout = new Running([lat, lng], distance, duration, temp);
    }

    //Добавить новый объект в массив тренировок
    this.#workouts.push(workout);
    //Отобразить тренировку на карте

    //Если тренировка является велотренировкой, то создать объект Cycling
    if (type === 'cycling') {
      const climb = +inputClimb.value;
      //Проверка валидности данных
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(climb)
        !areNumbers(distance, duration, climb) ||
        !areNumbersPositive(distance, duration)
      )
        return alert(`Please enter positive number`);
      workout = new Cycling([lat, lng], distance, duration, climb);
    }
    //Добавить новый объект в массив тренировок
    this.#workouts.push(workout);
    console.log(workout);
    //Отобразить тренировку на карте
    this._displayWorkout(workout);
    //Отобразить тренировкку в списке
    this._displayWorkoutOnSidebar(workout);
    //Спрятать форму и очистить поля ввода данных
    this._hideForm();
    // Добавить все тренировки в локальное хранилище
    this._addWorkoutsToLocalStorage();
  }
  _displayWorkout(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 200,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚵‍♂️'} ${workout.description}`
      )
      .openPopup();
  }
  _displayWorkoutOnSidebar(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃' : '🚵‍♂️'
        }</span>
        <span class="workout__value"${workout.distance}</span>
        <span class="workout__unit">км</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">мин</span>
      </div>
      `;
    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
             <span class="workout__icon">📏⏱</span>
            <span class="workout__value">${workout.pace.toFixed(2)}</span>
            <span class="workout__unit">мин/км</span>
        </div>
    <div class="workout__details">
      <span class="workout__icon">👟⏱</span>
      <span class="workout__value">${workout.temp}</span>
      <span class="workout__unit">шаг/мин</span>
    </div>
  </li>`;
    }
    if (workout.type === 'cycling') {
      html += `
            <div class="workout__details">
                <span class="workout__icon">📏⏱</span>
                <span class="workout__value">${workout.speed.toFixed(2)}</span>
                <span class="workout__unit">км/ч</span>
            </div>
      <div class="workout__details">
        <span class="workout__icon">🏔</span>
        <span class="workout__value">${workout.climb}</span>
        <span class="workout__unit">м</span>
      </div>
    </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToWorkout(e) {
    const workoutElement = e.target.closest('.workout');
    console.log(workoutElement);
    if (!workoutElement) return;
    const workout = this.#workouts.find(
      item => item.id === workoutElement.dataset.id
    );

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    });
  }

  _addWorkoutsToLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorageData() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;

    this.#workouts.forEach(workout => {
      this._displayWorkoutOnSidebar(workout);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    //перезагружаем страницу
    location.reload();
  }
}

const app = new App();
