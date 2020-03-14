import React from 'react'
import {
    REGISTERED,
    WAITING_FOR_REPLY,
    DECLINED,
    COMPLETED,
    DOING
} from './constants'

export default function getTag(status) {
    switch (status) {
        case REGISTERED:
            return <span className="tag is-primary">{status}</span>
        case DOING:
            return <span className="tag is-warning">{status}</span>
        case WAITING_FOR_REPLY:
            return <span className="tag is-info">{status}</span>
        case DECLINED:
            return <span className="tag is-danger">{status}</span>
        case COMPLETED:
            return <span className="tag is-success">{status}</span>
        default:
            return <span className="tag">{status}</span>
    }
}
