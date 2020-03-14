import React, { useState } from 'react'
import ReactMapGL, { Marker } from 'react-map-gl'

export function Map(props) {
    const { latitude, longitude } = props
    const [viewport, setViewport] = useState({
        width: 800,
        height: 400,
        latitude: latitude,
        longitude: longitude,
        zoom: 16
    })

    if (latitude && longitude) {
        return (
            <ReactMapGL
                {...viewport}
                onViewportChange={setViewport}
                mapboxApiAccessToken={process.env.REACT_APP_MAP_TOKEN}
            >
                <Marker
                    latitude={latitude}
                    longitude={longitude}
                    offsetLeft={-20}
                    offsetTop={-10}
                >
                    <div>📌</div>
                </Marker>
            </ReactMapGL>
        )
    }
    return null
}
