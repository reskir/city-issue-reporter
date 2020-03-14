import React from 'react'

const fetchUsers = () =>
    fetch('//localhost:3001/getUsers').then(res => res.json())

export default function Users() {
    const [data, setData] = React.useState([])
    const [isDataFetched, setIsDataFetched] = React.useState(false)

    if (!isDataFetched) {
        fetchUsers()
            .then(data => {
                setIsDataFetched(true)
                if (data) {
                    setData(data)
                }
            })
            .catch(e => {
                setIsDataFetched(true)
            })
    }
    if (data.length) {
        return (
            <div className="container">
                {data.map(({ name, tickets, _id }) => {
                    const registeredTickets = tickets.filter(
                        ({ currentStatus }) =>
                            currentStatus.status === 'registruotas'
                    )
                    return (
                        <div className="card padding-24 margin-24" key={_id}>
                            <div className="content">
                                <div className="level">
                                    <div className="level-item has-text-centered">
                                        <div>
                                            <p className="heading">
                                                Vartotojas
                                            </p>
                                            <p className="title">{name}</p>
                                        </div>
                                    </div>
                                    <div className="level-item has-text-centered">
                                        <div>
                                            <p className="heading">
                                                Iš viso pranešimų
                                            </p>
                                            <p className="title">
                                                {tickets.length}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="level-item has-text-centered">
                                        <div>
                                            <p className="heading">
                                                Užregistruoti pranešimai
                                            </p>
                                            <p className="title has-text-success">
                                                {registeredTickets.length}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }
    return null
}
