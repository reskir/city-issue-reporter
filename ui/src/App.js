import React from 'react'
import { StatusSelect } from './StatusSelect'
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
            .then(data => {
                setIsDataFetched(false)
                setSelectValue(data.status)
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
                            <th>Valstybinis numeris</th>
                            <th>Laikas</th>
                            <th>Lokacija</th>
                            <th> Statusas </th>
                            <th>Nuotraukos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(ticket => {
                            return (
                                <tr key={ticket._id}>
                                    <td width="150">
                                        <span className="has-text-weight-bold">
                                            {ticket?.plateNumber}
                                        </span>
                                    </td>
                                    <td width="250">{ticket?.date}</td>
                                    <td width="300">
                                        {ticket?.location?.address}
                                    </td>
                                    <td width="310">
                                        <StatusSelect
                                            ticket={ticket}
                                            onChange={handleChange}
                                            onSubmit={updateStatus}
                                        />
                                    </td>
                                    <td width="300">
                                        <div className="columns">
                                            {ticket?.photos.length
                                                ? ticket.photos.map(photo => {
                                                      return (
                                                          <div
                                                              key={
                                                                  photo.file_id
                                                              }
                                                              className="column"
                                                          >
                                                              <figure className="image">
                                                                  <img
                                                                      src={
                                                                          photo.link
                                                                      }
                                                                      alt={
                                                                          photo.link
                                                                      }
                                                                      width="200"
                                                                  />
                                                                  <figcaption>
                                                                      <a
                                                                          href={
                                                                              photo.link
                                                                          }
                                                                      >
                                                                          Download
                                                                      </a>
                                                                  </figcaption>
                                                              </figure>
                                                          </div>
                                                      )
                                                  })
                                                : null}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </>
        )
    } else {
        return <h1>Nėra įrašų</h1>
    }
}

export default App
