import React from 'react'
import { StatusSelect } from './StatusSelect'
import { Map } from './Map'
import 'bulma/css/bulma.css'

const fetchTickets = fetch('//localhost:3001/getTickets').then(res =>
    res.json()
)

function App() {
    const [data, setData] = React.useState([])
    const [isDataFetched, setIsDataFetched] = React.useState(false)
    const [selectValue, setSelectValue] = React.useState('registruotas')

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
            .then(async data => {
                await fetchTickets.then(data => {
                    if (data) {
                        setData(data)
                        setSelectValue(data.status)
                    }
                })
            })
    }

    if (!isDataFetched) {
        fetchTickets
            .then(data => {
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
            <>
                <table className="table is-fullwidth is-bordered">
                    <thead className="has-background-success">
                        <tr>
                            <th>Vartotojas</th>
                            <th>Valstybinis numeris</th>
                            <th>Laikas</th>
                            <th>Lokacija</th>
                            <th>Statusas</th>
                            <th>Nuotraukos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(
                            ({
                                _id,
                                plateNumber,
                                status,
                                comment,
                                user,
                                photos,
                                location,
                                date = null
                            }) => {
                                return (
                                    <tr key={_id}>
                                        <td width="100">{user.name}</td>
                                        <td width="150">
                                            <span className="has-text-weight-bold">
                                                {plateNumber}
                                            </span>
                                        </td>
                                        <td width="250">{date}</td>
                                        <td width="300">
                                            <div>{location?.address}</div>
                                            <Map {...location} />
                                        </td>
                                        <td width="360">
                                            <StatusSelect
                                                ticketId={_id}
                                                status={status}
                                                comment={comment}
                                                onChange={handleChange}
                                                onSubmit={updateStatus}
                                            />
                                        </td>
                                        <td width="500">
                                            <div className="columns">
                                                {photos.length
                                                    ? photos.map(
                                                          ({
                                                              file_id,
                                                              link
                                                          }) => {
                                                              return (
                                                                  <div
                                                                      key={
                                                                          file_id
                                                                      }
                                                                      className="column"
                                                                  >
                                                                      <figure className="image">
                                                                          <img
                                                                              src={
                                                                                  link
                                                                              }
                                                                              alt={
                                                                                  link
                                                                              }
                                                                              width="200"
                                                                          />
                                                                          <figcaption>
                                                                              <a
                                                                                  href={
                                                                                      link
                                                                                  }
                                                                              >
                                                                                  Download
                                                                              </a>
                                                                          </figcaption>
                                                                      </figure>
                                                                  </div>
                                                              )
                                                          }
                                                      )
                                                    : null}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            }
                        )}
                    </tbody>
                </table>
            </>
        )
    } else {
        return <h1>Nėra įrašų</h1>
    }
}

export default App
