import flatpickr from 'flatpickr';

import { formatStringToDateTime } from '../utils.js';
import {POINT_EMPTY} from '../mock/const.js';
import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';

import 'flatpickr/dist/flatpickr.min.css';

const DEFAULT_TYPES = [
  {text: 'Taxi', id: 'taxi'},
  {text: 'Bus', id: 'bus'},
  {text: 'Train', id: 'train'},
  {text: 'Ship', id: 'ship'},
  {text:'Drive', id: 'drive'},
  {text: 'Flight', id: 'flight'},
  {text: 'Check-in', id: 'check-in'},
  {text: 'Sightseeing', id: 'sightseeing'},
  {text: 'Restaurant', id: 'restaurant'}];

const OFFFER_CHECKBOX_NAME = 'event-offer-luggage';

function createTypesTemplate () {
  return DEFAULT_TYPES.map((types) =>
    `<div class="event__type-item">
    <input id="event-type-${types.id}-1" class="event__type-input  visually-hidden" type="radio" name="event-type" value="${types.id}">
    <label class="event__type-label  event__type-label--${types.id}" for="event-type-${types.id}-1">${types.text}</label>
  </div>`
  ).join('');
}


function createOfferTemplate (offersData, checkedIDs) {
  const checkboxesMarkup = offersData.map((offer) =>
    `<div class="event__offer-selector">
<input class="event__offer-checkbox  visually-hidden" value="${offer.id}" id="${offer.id}" type="checkbox" name=${OFFFER_CHECKBOX_NAME} ${checkedIDs.includes(offer.id) ? 'checked' : ''}>
<label class="event__offer-label" for="${offer.id}">
  <span class="event__offer-title">${offer.title}</span>
  &plus;&euro;&nbsp;
  <span class="event__offer-price">${offer.price}</span>
</label>
</div>`).join('');

  return `
<section class="event__section  event__section--offers">
<h3 class="event__section-title  event__section-title--offers">Offers</h3>

<div class="event__available-offers">
${checkboxesMarkup}
</div>
</section>
  `;
}

function createPhotoTemplate (pictures) {
  return pictures.map((picture) =>
    `<img class="event__photo" src="${picture.src}" alt="${picture.description}">`
  ).join('');
}

function createDestinationList (pointDestinations) {
  return pointDestinations.map((city) =>
    `<option value="${city.name}"></option>`
  ).join('');
}


function getEditPointTemplate ({point, pointDestinations, offers}) {

  const {
    basePrice, dateFrom, dateTo, type
  } = point;


  const destination = pointDestinations.find((descPoint) => descPoint.id === point.destination);

  return `<li class="trip-events__item">
  <form class="event event--edit" action="#" method="post">
                <header class="event__header">
                  <div class="event__type-wrapper">
                    <label class="event__type  event__type-btn" for="event-type-toggle-1">
                      <span class="visually-hidden">Choose event type</span>
                      <img class="event__type-icon" width="17" height="17" src="img/icons/${type}.png" alt="Event type icon">
                    </label>
                    <input class="event__type-toggle  visually-hidden" id="event-type-toggle-1" type="checkbox">

                    <div class="event__type-list">
                      <fieldset class="event__type-group">
                        <legend class="visually-hidden">Event type</legend>
                        ${createTypesTemplate()}
                      </fieldset>
                    </div>
                  </div>



                  <div class="event__field-group  event__field-group--destination">
                    <label class="event__label  event__type-output" for="event-destination-1">
                      ${type}
                    </label>
                    <input class="event__input  event__input--destination" id="event-destination-1" type="text" name="event-destination" value="${destination.name}" list="destination-list-1">
                    <datalist id="destination-list-1">
                    ${createDestinationList(pointDestinations)}
                    </datalist>
                  </div>

                  <div class="event__field-group  event__field-group--time">
                    <label class="visually-hidden" for="event-start-time-1">From</label>
                    <input class="event__input  event__input--time" id="event-start-time-1" type="text" name="event-start-time" value="${formatStringToDateTime(dateFrom)}">
                    &mdash;
                    <label class="visually-hidden" for="event-end-time-1">To</label>
                    <input class="event__input  event__input--time" id="event-end-time-1" type="text" name="event-end-time" value="${formatStringToDateTime(dateTo)}">
                  </div>

                  <div class="event__field-group  event__field-group--price">
                    <label class="event__label" for="event-price-1">
                      <span class="visually-hidden">Price</span>
                      &euro;
                    </label>
                    <input class="event__input  event__input--price" id="event-price-1" type="number" name="event-price" value="${basePrice}">
                  </div>

                  <button class="event__save-btn  btn  btn--blue" type="submit">Save</button>
                  <button class="event__reset-btn" type="reset">Delete</button>
                  <button class="event__rollup-btn" type="button">
                    <span class="visually-hidden">Open event</span>
                  </button>
                </header>

                <section class="event__details">
                ${createOfferTemplate(offers, point.offers)}

                  <section class="event__section  event__section--destination">
                    <h3 class="event__section-title  event__section-title--destination">Destination</h3>
                    <p class="event__destination-description">${destination.description}</p>
                    <div class="event__photos-container">
                      <div class="event__photos-tape">
                    ${createPhotoTemplate(destination.pictures)}
                      </div>
                    </div>
                  </section>
                </section>
              </form>
              </li>
`;
}
export default class EditPointView extends AbstractStatefulView {
  #pointDestinations = null;
  #onFormSubmit = null;
  #onResetClick = null;
  #onCloseClick = null;
  #getOffersByType = null;
  #datepickerFrom = null;
  #datepickerTo = null;

  constructor({point = POINT_EMPTY, pointDestinations, offers, onFormSubmit, onCloseClick, onResetClick, getOffersByType}) {
    super();
    this.#getOffersByType = getOffersByType;

    this._setState({
      point,
      offers,
      pointDestinations,
    });
    this.#pointDestinations = pointDestinations;
    this.#onFormSubmit = onFormSubmit;
    this.#onResetClick = onResetClick;
    this.#onCloseClick = onCloseClick;

    this._restoreHandlers();
  }

  get template() {
    return getEditPointTemplate(this._state);
  }

  /**
   * @param {Event} evt
   */
  #onTypeChange = (evt) => {
    const type = evt.target.value;

    this.updateElement({
      point: {
        ...this._state.point,
        type,
      },
      offers: this.#getOffersByType(type)
    });
  };

  #priceInputChange = (evt) => {
    evt.preventDefault();

    this._setState({
      point: {
        ...this._state.point,
        basePrice: evt.target.valueAsNumber
      }
    });
  };

  #destinationInputChange = (evt) => {

    const selectedDestinations = this.#pointDestinations.find((pointDestination) => pointDestination.name === evt.target.value);

    const selectedDestinationId = (selectedDestinations) ? selectedDestinations.id : null;

    this.updateElement({
      point: {
        ...this._state.point,
        destination: selectedDestinationId
      }
    });
  };

  reset = (point) => this.updateElement({point});

  removeElement = () => {
    super.removeElement();

    if (this.#datepickerFrom) {
      this.#datepickerFrom.destroy();
      this.#datepickerFrom = null;
    }

    if (this.#datepickerTo) {
      this.#datepickerTo.destroy();
      this.#datepickerTo = null;
    }
  };

  #dateToChangeHandler = ([userDate]) => {
    this._setState({
      point: {
        ...this._state.point,
        dateTo: userDate
      }
    });
    this.#datepickerFrom.set('maxDate', this._state.point.dateTo);
  };

  #dateFromChangeHandler = ([userDate]) => {
    this._setState({
      point: {
        ...this._state.point,
        dateFrom: userDate
      }
    });
    this.#datepickerFrom.set('minDate', this._state.point.dateFrom);
  };

  #setDatepickers = () => {
    this.#datepickerFrom = flatpickr(
      this.element.querySelector('#event-start-time-1'),
      {
        dateFormat: 'd/m/y H:i',
        defaultDate: this._state.point.dateFrom,
        onClose: this.#dateFromChangeHandler,
        enableTime: true,
        maxDate: this._state.point.dateTo,
        locale: {
          firstDayOfWeek: 1,
        },
        'time_24hr': true
      },
    );

    this.#datepickerTo = flatpickr(
      this.element.querySelector('#event-end-time-1'),
      {
        dateFormat: 'd/m/y H:i',
        defaultDate: this._state.point.dateTo,
        onClose: this.#dateToChangeHandler,
        enableTime: true,
        minDate: this._state.point.dateFrom,
        locale: {
          firstDayOfWeek: 1,
        },
        'time_24hr': true
      },
    );
  };

  _restoreHandlers = () => {
    const form = this.element.querySelector('form');
    this.element.querySelector('.event__rollup-btn').addEventListener('click', this.#onCloseClick);

    form.addEventListener('submit', this.#onFormSubmitClick);

    this.element.querySelector('.event__type-group').addEventListener('change', this.#onTypeChange);

    this.element.querySelector('.event__input--destination').addEventListener('change', this.#destinationInputChange);

    this.element.querySelector('.event__input--price').addEventListener('change', this.#priceInputChange);

    this.#setDatepickers();
  };

  #onFormSubmitClick = (evt) => {
    evt.preventDefault();
    const form = evt.target;
    const formData = new FormData(form);
    const offers = formData.getAll(OFFFER_CHECKBOX_NAME);

    this.#onFormSubmit({
      ...this._state.point,
      offers
    });
  };
}
