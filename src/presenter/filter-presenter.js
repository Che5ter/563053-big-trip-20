import FilterView from '../view/filter-view.js';

import {generateFilters} from '../utils/filter.js';
import {UpdateType} from '../const.js';
import {render, replace, remove} from '../framework/render.js';

export default class FilterPresenter {
  #container = null;
  #filterComponent = null;

  #pointsModel = null;
  #filterModel = null;

  #currentFilter = null;

  constructor({container, pointsModel, filterModel}) {
    this.#container = container;
    this.#pointsModel = pointsModel;
    this.#filterModel = filterModel;

    this.#pointsModel.addObserver(this.#modeEventHandler);
    this.#filterModel.addObserver(this.#modeEventHandler);
  }

  get filters() {
    const points = this.#pointsModel.get();
    return generateFilters(points);
  }

  init() {
    this.#currentFilter = this.#filterModel.get();

    const prevFilterComponent = this.#filterComponent;

    this.#filterComponent = new FilterView({
      filters: this.filters,
      currentFilter: this.#currentFilter,
      onFilterChange: this.#filterTypeChangeHandler
    });

    if (prevFilterComponent === null) {
      render(this.#filterComponent, this.#container);
      return;
    }

    replace(this.#filterComponent, prevFilterComponent);
    remove(prevFilterComponent);
    //render(new FilterView(this.#filters), this.#container);
  }

  #modeEventHandler = () => {
    this.init();
  };

  #filterTypeChangeHandler = (filterType) => {
    this.#filterModel.set(UpdateType.MAJOR, filterType);
  };
}
