import React from 'react'
import Tickets from './components/Tickets'
import Users from './components/Users'
import Ticket from './components/Ticket'
import {
    BrowserRouter as Router,
    Switch,
    Route,
    NavLink
} from 'react-router-dom'
import './App.scss'

export default function App() {
    return (
        <Router>
            <div>
                <nav className="tabs">
                    <ul>
                        <li>
                            <NavLink
                                activeStyle={{
                                    color: 'red'
                                }}
                                to="/tickets"
                            >
                                Pažeidimai
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                activeStyle={{
                                    color: 'red'
                                }}
                                to="/users"
                            >
                                Vartotojai
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                {/* A <Switch> looks through its children <Route>s and
              renders the first one that matches the current URL. */}
                <Switch>
                    <Route path="/tickets">
                        <Tickets />
                    </Route>
                    <Route path="/users">
                        <Users />
                    </Route>
                    <Route path="/:id" children={<Ticket />} />
                </Switch>
            </div>
        </Router>
    )
}
