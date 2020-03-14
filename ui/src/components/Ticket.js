import React, { useState } from 'react'
import { StatusSelect } from './StatusSelect'
import { Map } from '../Map'
import { useParams } from 'react-router-dom'
import getTag from './helpers/getTag'

const fetchTicket = id => {
    return fetch(`//localhost:3001/getTicket/${id}`).then(res => res.json())
}

export default function Ticket() {
    const [ticket, setTicket] = useState(null)
    const [modal, showModal] = useState(false)
    const [selectValue, setSelectValue] = useState('registruotas')
    const { id } = useParams()

    function handleChange(e) {
        setSelectValue(e.target.value)
    }

    function updateStatus(ticketId, comment) {
        fetch(
            `//localhost:3001/updateStatus/?ticketId=${ticketId}&status=${selectValue}&comment=${comment}`,
            {
                method: 'POST'
            }
        )
            .then(res => res.json())
            .then(data => {
                fetchTicket(ticketId).then(ticket => {
                    if (ticket) {
                        setTicket(ticket)
                        setSelectValue(ticket.currentStatus.status)
                    }
                })
            })
    }
    if (!ticket)
        fetchTicket(id).then(ticket => {
            setTicket(ticket)
        })

    if (modal) {
        return (
            <div className="modal is-active">
                <div className="modal-background"></div>
                <div className="modal-content">
                    <StatusSelect
                        {...ticket}
                        ticketId={id}
                        onSubmit={updateStatus}
                        onChange={handleChange}
                    />
                </div>
                <button
                    className="modal-close is-large"
                    aria-label="close"
                    onClick={() => showModal(false)}
                ></button>
            </div>
        )
    }

    if (ticket) {
        const {
            location,
            plateNumber,
            date,
            time,
            photos,
            documents,
            currentStatus: { status }
        } = ticket
        const files = [...documents, ...photos]
        const data = new Date(time || date).toLocaleString('lt-LT', {
            timeZone: 'Europe/Vilnius'
        })
        return (
            <div className="container">
                <div className="card margin-24 padding-24">
                    <nav className="level">
                        <div className="level-item has-text-centered">
                            <div>
                                <p>Valstybinis numeris</p>
                                <p>{plateNumber}</p>
                            </div>
                        </div>
                        <div className="level-item has-text-centered">
                            <div>
                                <p>data / laikas</p>
                                <p>{data}</p>
                            </div>
                        </div>
                        <div className="level-item has-text-centered">
                            <div>
                                <p>Status</p>
                                <p>{getTag(status)}</p>
                            </div>
                        </div>
                        <div className="level-item has-text-centered">
                            <div>
                                <button
                                    className="button"
                                    onClick={() => showModal(true)}
                                >
                                    Atnaujinti statusą
                                </button>
                            </div>
                        </div>
                    </nav>
                </div>

                <div className="card margin-24 padding-24">
                    <div className="columns is-mobile">
                        {files.map(file => {
                            return (
                                <div className="column" key={file._id}>
                                    <img
                                        width={200}
                                        src={file.link}
                                        alt={file.link}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="card margin-24 padding-24">
                    {location && (
                        <>
                            <p>{location?.address}</p>
                            <Map {...location} />
                        </>
                    )}
                    {!location && <p>Location is undefined</p>}
                </div>
            </div>
        )
    }

    return null
}
