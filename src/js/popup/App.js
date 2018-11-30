import React, { Component, Fragment } from "react";
import cx from "classnames";
import Modal from "react-modal";

import BigCalendar from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { getSelfUser, getGamesForGroup } from "./api";

import "./styles.css";
import { DH_CHECK_P_NOT_PRIME } from "constants";

const localizer = BigCalendar.momentLocalizer(moment); // or globalizeLocalizer

const customStyles = {
  overlay: {
    background: "rgba(0,0,0,.5)"
  },
  content: {
    padding: 0
  }
};

export default class App extends Component {
  constructor(...args) {
    super(...args);
    this.state = { hiddenGameModes: [] };
  }

  async getData() {
    const user = await getSelfUser();

    this.user = user;

    user.groups.forEach(group => {
      getGamesForGroup(group.id, games => {
        const events = games.map(game => {
          const start = new Date(game.start_time);
          const end = new Date(start);
          end.setHours(end.getHours() + 2);

          return {
            title: game.category,
            start,
            end,
            game
          };
        });

        const uniqueGameTypes = games.reduce((acc, game) => {
          if (!acc.includes(game.category)) {
            return [...acc, game.category];
          }

          return acc;
        }, []);

        const minTimeDate = new Date();
        const maxTimeDate = new Date();

        minTimeDate.setHours(
          Math.max(Math.min(...events.map(e => e.start.getHours())) - 1, 0)
        );
        maxTimeDate.setHours(
          Math.min(Math.max(...events.map(e => e.end.getHours())) + 1, 23)
        );

        this.setState({
          events,
          minTimeDate,
          maxTimeDate,
          uniqueGameTypes
        });
      });
    });
  }

  componentDidMount() {
    this.getData();

    chrome.storage.sync.get(["hiddenGameModes"], result => {
      if (result && result.hiddenGameModes) {
        this.setState({
          hiddenGameModes: JSON.parse(result.hiddenGameModes)
        });
      }
    });
  }

  renderTitle = event => {
    const isInGame = event.game.confirmed_sessions.find(player => {
      return player.user_id === this.user.id;
    });

    return (
      <div>
        <div>
          {isInGame && "🙋🏻‍♀️ "} {event.title}
        </div>

        {event.game.full && (
          <div>
            <span className="tag">[FULL]</span>
          </div>
        )}
      </div>
    );
  };

  eventPropGetter = event => {
    const isInGame = event.game.confirmed_sessions.find(player => {
      return player.user_id === this.user.id;
    });

    const gameIsFull = event.game.full;

    return { className: cx("game", { isInGame, gameIsFull }) };
  };

  toggleGameType = ev => {
    const { hiddenGameModes } = this.state;
    const gameMode = ev.target.name;
    const isHidden = !ev.target.checked;

    const newHiddens = hiddenGameModes.includes(gameMode)
      ? hiddenGameModes.filter(m => m !== gameMode)
      : [...hiddenGameModes, gameMode];

    chrome.storage.sync.set({ hiddenGameModes: JSON.stringify(newHiddens) });

    this.setState({ hiddenGameModes: newHiddens });
  };

  onSelectEvent = event => {
    console.log("clicked event", event);
    this.setState({ activeEvent: event });
  };

  closeModal = () => {
    this.setState({
      activeEvent: null
    });
  };

  render() {
    const {
      events,
      minTimeDate,
      maxTimeDate,
      uniqueGameTypes,
      hiddenGameModes,
      activeEvent
    } = this.state;

    const filteredEvents =
      events &&
      events.filter(event => {
        const isHidden = this.state.hiddenGameModes.includes(
          event.game.category
        );

        return !isHidden;
      });

    return (
      <div className="fullHeight">
        <h1>Calendar</h1>
        <div className="calendarContainer">
          {events && (
            <BigCalendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              defaultView={BigCalendar.Views.WEEK}
              titleAccessor={this.renderTitle}
              eventPropGetter={this.eventPropGetter}
              onSelectEvent={this.onSelectEvent}
              min={minTimeDate}
              max={maxTimeDate}
            />
          )}
        </div>

        <div>
          <h2>Toggle game types</h2>

          {uniqueGameTypes &&
            uniqueGameTypes.map(gameType => (
              <div key={gameType}>
                <label>
                  <input
                    onChange={this.toggleGameType}
                    type="checkbox"
                    name={gameType}
                    checked={!hiddenGameModes.includes(gameType)}
                  />{" "}
                  {gameType}
                </label>
              </div>
            ))}

          <h3>Hidden</h3>
          <pre>{JSON.stringify(hiddenGameModes, null, 2)}</pre>
        </div>

        <Modal
          isOpen={!!activeEvent}
          style={customStyles}
          onRequestClose={this.closeModal}
        >
          {activeEvent && (
            <Fragment>
              <button className="closeButton" onClick={this.closeModal}>
                <span className="cross">⨯</span> Close
              </button>
              <iframe
                className="iframe"
                src={`https://www.the100.io/gaming_sessions/${
                  activeEvent.game.id
                }`}
              />
            </Fragment>
          )}
        </Modal>
      </div>
    );
  }
}
