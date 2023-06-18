import { SortType, UserAction, UpdateType } from '../const.js';
import {render, remove, replace} from '../framework/render.js';
import { filter, FilterType } from '../utils/filter.js';
import { getPointsDateDifference, getPointsDurationDifference, getPointsPriceDifference } from '../utils/point.js';
import EventListView from '../view/event-list-view.js';
import NewPointButtonView from '../view/new-button-view.js';
import SortView from '../view/sort-view.js';
import NewPointPresenter from './new-point-presenter.js';
import PointPresenter from './point-presenter.js';
import MessageView from '../view/message-view.js';

export default class BoardPresenter {
  #eventListComponent = new EventListView();
  #container = null;
  #newPointButtonContainer = null;
  #destinationModel = null;
  #offersModel = null;
  #pointsModel = null;
  #sortComponent = null;
  #pointPresenters = new Map();
  #currentSortType = SortType.DAY;
  #filterModel = null;
  #newPointPresenter = null;
  #newPointButton = null;
  #messageComponent;
  #handleModelEvent = null;
  #isCreating = false;

  constructor({container, newPointButtonContainer, destinationsModel, offersModel, pointsModel, filterModel}) {
    this.#container = container;
    this.#newPointButtonContainer = newPointButtonContainer;
    this.#destinationModel = destinationsModel;
    this.#offersModel = offersModel;
    this.#pointsModel = pointsModel;
    this.#filterModel = filterModel;

    this.#newPointPresenter = new NewPointPresenter({
      container: this.#eventListComponent.element,
      destinationsModel: this.#destinationModel,
      offersModel: this.#offersModel,
      onDataChange: this.#viewActionHandler,
      onDestroy: this.#newPointDestroyHandler
    });

    this.#pointsModel.addObserver(this.#modelEventHandler);
    this.#filterModel.addObserver(this.#modelEventHandler);
  }

  get points() {
    const filterType = this.#filterModel.filter;
    const filteredPoints = filter[filterType](this.#pointsModel.points);

    return this.#sortPoints(this.#currentSortType, filteredPoints);
  }

  init() {
    this.#newPointButton = new NewPointButtonView ({onclick: this.#newPointButtonClickHandler});
    render(this.#newPointButton, this.#newPointButtonContainer);
    this.#renderBoard();
  }

  #sortPoints(sortType, filteredData) {
    switch (sortType) {
      case SortType.DAY:
        filteredData.sort(getPointsDateDifference);
        break;
      case SortType.TIME:
        filteredData.sort(getPointsDurationDifference);
        break;
      case SortType.PRICE:
        filteredData.sort(getPointsPriceDifference);
        break;
    }
    this.#currentSortType = sortType;
    return filteredData;
  }

  #renderSort() {
    const prevSortComponent = this.#sortComponent;

    this.#sortComponent = new SortView({
      sortType: this.#currentSortType,
      onSortTypeChange: this.#handleSortTypeChange,
      points: this.points
    });

    if (prevSortComponent) {
      replace(this.#sortComponent, prevSortComponent);
      remove(prevSortComponent);
    } else {
      render(this.#sortComponent, this.#container);
    }
  }

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType !== sortType) {
      this.#currentSortType = sortType;
      this.#clearPoints();
      this.#renderSort();
      this.#renderPoints();
    }
  };

  #renderListComponent() {
    render(this.#eventListComponent, this.#container);
  }

  #renderPoint = (point) => {

    const pointPresenter = new PointPresenter({
      container: this.#eventListComponent.element,
      destinationModel: this.#destinationModel,
      offersModel: this.#offersModel,
      onDataChange: this.#viewActionHandler,
      onModeChange: this.#modeChangeHandler
    });

    pointPresenter.init(point);
    this.#pointPresenters.set(point.id, pointPresenter);
  };

  #renderPoints() {
    this.points.forEach(this.#renderPoint);
  }

  #clearPoints() {
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();
  }

  #renderMessage() {
    this.#messageComponent = new MessageView({filterType: this.#filterModel.filter});
    render(this.#messageComponent, this.#container);
  }

  #renderBoard() {
    if (this.points.length === 0 && !this.#isCreating) {
      this.#renderMessage();
      return;
    }

    this.#renderSort();
    this.#renderListComponent();
    this.#renderPoints();
  }

  #clearBoard = ({resetSortType = false} = {}) => {
    this.#clearPoints();
    if (this.#messageComponent) {
      remove(this.#messageComponent);
    }

    if (resetSortType) {
      this.#currentSortType = SortType.DAY;
    }
  };

  #viewActionHandler = (actionType, updateType, update) => {
    switch (actionType) {
      case UserAction.UPDATE_POINT:
        this.#pointsModel.update(updateType, update);
        break;
      case UserAction.DELETE_POINT:
        this.#pointsModel.delete(updateType, update);
        break;
      case UserAction.CREATE_POINT:
        this.#pointsModel.add(updateType, update);
        break;
    }
  };

  #modelEventHandler = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#pointPresenters.get(data.id)?.init(data);
        break;
      case UpdateType.MINOR:
        this.#clearBoard();
        this.#renderBoard();
        break;
      case UpdateType.MAJOR:
        this.#clearBoard({resetSortType: true});
        this.#renderBoard();
        break;
    }
  };

  #modeChangeHandler = () => {
    this.#pointPresenters.forEach((presenter) => presenter.resetView());
    this.#newPointPresenter.destroy();
  };

  #newPointButtonClickHandler = () => {
    this.#isCreating = true;
    this.#currentSortType = SortType.DAY;
    this.#filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);
    this.#newPointButton.setDisabled(true);
    this.#newPointPresenter.init();
  };

  #newPointDestroyHandler = () => {
    this.#isCreating = false;
    this.#newPointButton.setDisabled(false);
    if (this.points.length === 0) {
      remove(this.#sortComponent);
      this.#sortComponent = null;
      this.#renderMessage();
    }
  };
}
