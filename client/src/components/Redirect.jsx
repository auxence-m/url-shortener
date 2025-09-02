import {useParams} from "react-router-dom";


export default function Redirect() {
    const params = useParams();

    const token = params.token;
    window.location.href = `https://url-shortener-949949589385.northamerica-northeast1.run.app/${token}`;

    return null
}