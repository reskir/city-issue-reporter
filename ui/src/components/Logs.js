import React from 'react'
import getTag from './helpers/getTag'

export function Logs({ updates }) {
    if (updates.length) {
        return updates.reverse().map(({ status, comment, time, _id }) => {
            const date = new Date(time).toLocaleString('lt-LT', {
                timeZone: 'Europe/Vilnius'
            })
            return (
                <div className="box" key={_id}>
                    <div className="content">
                        <div>
                            <strong>{getTag(status)}</strong> /{' '}
                            <small>{date}</small>
                            <br />
                            <br />
                            {comment && <p>{comment}</p>}
                        </div>
                    </div>
                </div>
            )
        })
    }
    return null
}
