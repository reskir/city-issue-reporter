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
                <div className="columns is-desktop is-multiline">
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
                                    className="column is-one-quarter card margin-24"
                                    key={_id}
                                >
                                    <div className="card-content">
                                        <Link to={`/${_id}`}>
                                            <div>
                                                <p className="subtitle">
                                                    {plateNumber}
                                                </p>
                                                <div className="has-text-grey-light">
                                                    <div>{getTag(status)}</div>
                                                    <div>{data}</div>
                                                </div>
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
