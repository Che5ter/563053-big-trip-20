import { render, replace, remove } from '../framework/render.js';
import EditPointView from '../view/edit-point-view.js';
import TripItemView from '../view/trip-item-view.js';

const Mode = {
  DEFAULT: 'DEFAULT',
  EDITING: 'EDITING'
};

export default class PointPresenter {
  #container = null;
  #point = null;
  #pointComponent = null;
  #destinationModel = null;
  #offersModel = null;
  #editPointComponent = null;
  #handleDataChange = null;
  #handleModeChange = null;
  #pointOffers = null;
  #mode = Mode.DEFAULT;

  constructor({container, destinationModel, offersModel, onDataChange, onModeChange}) {
    this.#container = container;
    this.#destinationModel = destinationModel;
    this.#offersModel = offersModel;
    this.#handleDataChange = onDataChange;
    this.#handleModeChange = onModeChange;
  }

  init(point) {

    this.#point = point;

    const prevPointComponent = this.#pointComponent;
    const prevPointEditComponent = this.#editPointComponent;


    this.#pointComponent = new TripItemView({
      point1: this.#point,
      pointDestinations: this.#destinationModel.destinations,
      pointOffers: this.#offersModel.offers,
      onEditClick: this.#handleClickEdit,
      onFavoriteClick: this.#handleFavoriteClick,
    });

    this.#editPointComponent = new EditPointView({
      point,
      pointDestinations: this.#destinationModel.destinations,
      offers: this.#offersModel.getByType(point.type),
      onFormSubmit: this.#handleFormSubmit,
      onCloseClick: this.#handleClickClose,
      getOffersByType: (type) => this.#offersModel.getByType(type)}
    );

    if (prevPointComponent === null || prevPointEditComponent === null) {
      return render(this.#pointComponent, this.#container);
    }

    if (this.#mode === Mode.DEFAULT) {
      replace(this.#pointComponent, prevPointComponent);
    }

    if (this.#mode === Mode.EDITING) {
      replace(this.#editPointComponent, prevPointEditComponent);
    }

    remove(prevPointComponent);
    remove(prevPointEditComponent);
  }

  destroy() {
    remove(this.#pointComponent);
    remove(this.#editPointComponent);
  }

  #onChangeOfferType = () => this.#offersModel.getByType(this.point.type);

  resetView() {
    if (this.#mode !== Mode.DEFAULT) {
      this.#replaceFormToPoints();
    }
  }

  #handleFavoriteClick = () => {
    this.#handleDataChange({...this.#point, isFavorite: !this.#point.isFavorite});
  };

  #onEscKeydown = (evt) => {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      this.#replaceFormToPoints();
      document.removeEventListener('keydown', this.#onEscKeydown);
    }
  };

  #replacePointsToForm() {
    replace(this.#editPointComponent, this.#pointComponent);
    this.#handleModeChange();
    this.#mode = Mode.EDITING;
  }

  #replaceFormToPoints() {
    replace(this.#pointComponent, this.#editPointComponent);
    this.#mode = Mode.DEFAULT;
  }

  #handleFormSubmit = (point) => {
    this.#handleDataChange(point);
    this.#replaceFormToPoints();
    document.removeEventListener('keydown', this.#onEscKeydown);
  };

  #handleClickEdit = () => {
    this.#replacePointsToForm();
    document.addEventListener('keydown', this.#onEscKeydown);
  };

  #handleClickClose = () => {
    this.#replaceFormToPoints();
    document.addEventListener('keydown', this.#onEscKeydown);
  };
}
