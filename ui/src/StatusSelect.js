import React from 'react'

function StatusSelect({ ticket, onChange, onSubmit }) {
    const [ticketStatus, setTicketStatus] = React.useState(ticket.status)
    const [buttonText, setButtonText] = React.useState('Pakeisti statusą')
    const ticketId = ticket._id
    return (
        <form>
            <div className="field has-addons">
                <div className="control is-expanded">
                    <div className="select is-fullwidth">
                        <select
                            onChange={e => {
                                setTicketStatus(e.target.value)
                                onChange(e)
                            }}
                            value={ticketStatus}
                        >
                            <option value="laukiama atsakymo"></option>
                            <option value="registruotas">registruotas</option>
                            <option value="nagrinėjimas">nagrinėjimas</option>
                            <option value="atmestas">atmestas ❌</option>
                            <option value="išnagrinėtas">išnagrinėtas</option>
                        </select>
                    </div>
                </div>
                <div className="control">
                    <button
                        className="button is-info"
                        type="submit"
                        onClick={e => {
                            e.preventDefault()
                            onSubmit(ticketId)
                        }}
                        disabled={ticketStatus === ticket.status}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </form>
    )
}

export { StatusSelect }
