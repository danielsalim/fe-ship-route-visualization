import { ActionType } from "./action";

function layersReducer(state = {}, action = {}) {
    switch (action.type) {
        case ActionType.GET_MAP:
            return {
                ...state,
                map: action.payload
            }
        case ActionType.GET_ROUTE:
            return {
                ...state,
                route: action.payload
            }
        case ActionType.GET_S57_DATA:
            return {
                ...state,
                s57: action.payload
            }
        default:
            return state
    }
}

export default layersReducer