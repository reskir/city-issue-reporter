import React from 'react'
import getTag from './helpers/getTag'
import { Link } from 'react-router-dom'
const fetchTickets = fetch('//localhost:3001/getTickets').then(res =>
    res.json()
)

function Tickets() {
    const [data, setData] = React.useState([])
    const [isDataFetched, setIsDataFetched] = React.useState(false)

    console.count(isDataFetched, data)

    if (!isDataFetched) {
        fetchTickets
            .then(async data => {
                if (data) {
                    setData(data)
                }
                setIsDataFetched(true)
            })
            .catch(e => {
                setIsDataFetched(true)
            })
    }

    if (data.length) {
        return (
            <div className="container">
                {data.map(({ _id, plateNumber, currentStatus: { status } }) => {
                    return (
                        <div className="card margin-24" key={_id}>
                            <div className="card-content">
                                <Link to={`/${_id}`}>
                                    <div>
                                        <p>{plateNumber}</p>
                                    </div>

                                    <div>
                                        <p>{getTag(status)}</p>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    } else {
        return <h1>Nėra įrašų</h1>
    }
}

export default Tickets
