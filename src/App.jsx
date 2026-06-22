import { useParams } from 'react-router-dom'
import guests from './data/guests.json'
import Invite from './Invite.jsx'

export default function App() {
  const { slug } = useParams()
  const key = slug ? slug.toLowerCase() : null
  const guest = key && guests[key] ? guests[key] : null
  return <Invite guest={guest} slug={key} />
}
