import React from 'react'

function StatusSelect({
    ticketId,
    currentStatus: { status, comment },
    onChange,
    onSubmit
}) {
    const [ticketStatus, setTicketStatus] = React.useState(status)
    const [textValue, setTextValue] = React.useState(comment)

    const statuses = ['atmestas', 'registruotas']

    const buttonDisabled = !textValue && statuses.includes(ticketStatus)

    return (
        <form>
            <div className="field has-addons">
                <div className="control is-expanded">
                    <div className="select is-fullwidth">
                        <select
                            onChange={e => {
                                if (status !== e.target.value) {
                                    setTextValue('')
                                } else {
                                    setTextValue(comment)
                                }
                                setTicketStatus(e.target.value)
                                onChange(e)
                            }}
                            value={ticketStatus}
                        >
                            <option value="laukiama patvirtinimo">
                                laukiama patvirtinimo
                            </option>
                            <option value="registruotas">registruotas</option>
                            <option value="nagrinėjimas">nagrinėjimas</option>
                            <option value="atmestas">atmestas</option>
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
                            onSubmit(ticketId, textValue)
                        }}
                        disabled={buttonDisabled}
                    >
                        Pakeisti statusą
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
