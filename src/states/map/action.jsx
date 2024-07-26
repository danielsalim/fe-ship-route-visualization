import api from '../../utils/services'
import { setIsNewRoute } from '../global/action'

const ActionType = {
    GET_LAYERS_DETAIL: "GET_LAYERS_DETAIL",
    GET_FEATURE_TYPE: "GET_FEATURE_TYPE",
    GET_MAP: "GET_MAP",

    GET_ROUTE: "GET_ROUTE",
    CLEAR_ROUTE: 'CLEAR_ROUTE',
    GET_S57_DATA: "GET_S57_DATA",
}

function getMap() {
    return async (dispatch) => {
        try {
            const map = await api.getS57MapGroup()
            dispatch({
                type: ActionType.GET_MAP,
                payload: map
            })
        } catch (error) {
            console.error("Error fetching data:", error)
        }
    }
}

function getRouteDispatch(startPoint, endPoint, minimumDepth, maxDistanceFromLand, neighborDistance) {
    return async (dispatch) => {
        try {
            const route = await api.getRoute(startPoint, endPoint, minimumDepth, maxDistanceFromLand, neighborDistance)
            dispatch({
                type: ActionType.GET_ROUTE,
                payload: route
            })
            dispatch(setIsNewRoute("NEW_ROUTE"))
        } catch (error) {
            console.error("Error fetching data:", error)
        }
    }
}

function clearRoute() {
    return (dispatch) => {
        dispatch({
            type: ActionType.CLEAR_ROUTE
        });
    };
}

function getS57LayersDispatch() {
    return async (dispatch) => {
        try {
            const layers = await api.getS57Layers()
            dispatch({
                type: ActionType.GET_S57_DATA,
                payload: layers
            })
        } catch (error) {
            console.error("Error fetching data:", error)
        }
    }
}

//TODO: buat untuk kirim ke backend dua point yang nanti bakal di return route nya

export {
    ActionType,
    getMap,
    getRouteDispatch,
    clearRoute,
    getS57LayersDispatch
}