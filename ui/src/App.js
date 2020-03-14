import React from 'react'
import Tickets from './components/Tickets'
import Users from './components/Users'
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom'
import './App.scss'

export default function App() {
    return (
        <Router>
            <div>
                <nav className="navbar">
                    <div className="navbar-menu">
                        <ul className="navbar-start">
                            <li className="navbar-item">
                                <Link to="/">Pagrindinis</Link>
                            </li>
                            <li className="navbar-item">
                                <Link to="/tickets">Pažeidimai</Link>
                            </li>
                            <li className="navbar-item">
                                <Link to="/users">Vartotojai</Link>
                            </li>
                        </ul>
                    </div>
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
                    <Route path="/">
                        <Tickets />
                    </Route>
                </Switch>
            </div>
        </Router>
    )
}
