import React from 'react'

function StatusSelect({ ticket, onChange, onSubmit }) {
    const [ticketStatus, setTicketStatus] = React.useState(ticket.status)
    const [buttonText, setButtonText] = React.useState('Pakeisti statusą')
    const [textValue, setTextValue] = React.useState(ticket.comment)
    const ticketId = ticket._id

    const statuses = ['atmestas', 'registruotas']

    // if (ticket.status === ticketStatus) {
    //     setTextValue('')
    // }

    const buttonDisabled =
        ticketStatus === ticket.status ||
        (!textValue && statuses.includes(ticketStatus))

    return (
        <form>
            <div className="field has-addons">
                <div className="control is-expanded">
                    <div className="select is-fullwidth">
                        <select
                            onChange={e => {
                                // if (ticket.status !== ticketStatus) {
                                //     setTextValue('')
                                // } else if (ticket.comment) {
                                //     if (ticket.comment !== textValue) {
                                //         setTextValue(textValue)
                                //     }
                                // } else {
                                //     setTextValue('')
                                // }
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
                            //e.preventDefault()
                            onSubmit(ticketId, textValue)
                        }}
                        disabled={buttonDisabled}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
            <div className="control">
                <textarea
                    value={textValue}
                    onChange={e => setTextValue(e.target.value)}
                    className="textarea"
                    placeholder="komentaras"
                ></textarea>
            </div>
        </form>
    )
}

export { StatusSelect }
