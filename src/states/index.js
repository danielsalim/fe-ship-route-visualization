import { configureStore } from '@reduxjs/toolkit';
import layersReducer from './map/reducer';
import globalReducer from './global/reducer';

const store = configureStore({
    reducer: {
        layers: layersReducer,
        globalState: globalReducer
    }
})

export default store