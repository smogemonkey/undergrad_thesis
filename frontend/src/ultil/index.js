import { formatDistanceToNow } from "date-fns"
import { jwtDecode } from "jwt-decode";
import projectApi from "../api/project";

export const timeFromNow = (timestamp) => {
    let result = '';
    if(timestamp){
        const date = new Date(timestamp);
        const timePeriod = formatDistanceToNow(date);
        result = `${timePeriod} ago`;
    }

    return result;
}

export const isSysAdmin = () => {
    const token = jwtDecode(localStorage.getItem("jwt"));
    return token.authorities.includes("SYS_ADMIN");
}

export const hasAnyPermission = (permissions) => {
    const token = jwtDecode(localStorage.getItem("jwt"));
    return permissions.some(permission => token.authorities.includes(permission));
}