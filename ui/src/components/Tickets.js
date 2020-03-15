import React from 'react'
import getTag from './helpers/getTag'
import { Link } from 'react-router-dom'

const fetchTickets = () =>
    fetch(`//${process.env.REACT_APP_HOST}:3001/getTickets`).then(res => {
        return res.json()
    })

function Tickets() {
    const [data, setData] = React.useState([])
    const [isDataFetched, setIsDataFetched] = React.useState(false)

    if (!isDataFetched) {
        fetchTickets()
            .then(async data => {
                setIsDataFetched(true)
                if (data) {
                    setData(data.reverse())
                }
            })
            .catch(e => {
                setIsDataFetched(true)
            })
    }

    if (data.length) {
        return (
            <div className="container">
                <div className="columns is-desktop">
                    {data.map(
                        ({
                            _id,
                            plateNumber,
                            currentStatus: { status },
                            date,
                            time
                        }) => {
                            const data = new Date(time || date).toLocaleString(
                                'lt-LT',
                                {
                                    timeZone: 'Europe/Vilnius'
                                }
                            )
                            return (
                                <div
                                    className="column card margin-24"
                                    key={_id}
                                >
                                    <div className="card-content">
                                        <Link to={`/${_id}`}>
                                            <div>
                                                <p className="subtitle">
                                                    {plateNumber}
                                                </p>
                                                <p className="has-text-grey-light">
                                                    {getTag(status)} / {data}
                                                </p>
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            )
                        }
                    )}
                </div>
            </div>
        )
    } else {
        return null
    }
}

export default Tickets
