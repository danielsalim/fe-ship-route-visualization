import React, { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Fill, Icon, Stroke, Style } from 'ol/style';
import { Circle as CircleStyle } from 'ol/style.js';
import { Feature, Map, View } from 'ol';
import { fromLonLat } from 'ol/proj';
import { asArray } from 'ol/color';

import MultiLineString from 'ol/geom/MultiLineString.js';
import { BiCurrentLocation } from "react-icons/bi";
import startIcon from '../assets/RiShip2Line.svg';
import endIcon from '../assets/FaLocationDot.svg';
import Select from 'ol/interaction/Select.js';
import DragBox from 'ol/interaction/DragBox';
import LineString from 'ol/geom/LineString';
import VectorSource from 'ol/source/Vector';
import RoutePlanning from './RoutePlanning';
import Geolocation from 'ol/Geolocation.js';
import VectorLayer from 'ol/layer/Vector';
import TileWMS from 'ol/source/TileWMS';
import Draw from 'ol/interaction/Draw';
import TileLayer from 'ol/layer/Tile';
import Polygon from 'ol/geom/Polygon';
import Circle from 'ol/geom/Circle';
import Point from "ol/geom/Point";
import OSM from 'ol/source/OSM';
import QEK from './qek/QEK';

import { setIsSwapClicked, setIsNodeValid, setIsNewRoute } from '../states/global/action';
import { BsFillExclamationCircleFill } from "react-icons/bs";
import { bbox as bboxStrategy } from 'ol/loadingstrategy.js';
import GeoJson from 'ol/format/GeoJSON';
import 'react-toastify/dist/ReactToastify.css';
import Bandung from '../Assets/Bandung.json';
import BaseObject from 'ol/Object.js';
import { toast } from 'react-toastify';
import { transform } from 'ol/proj';
import { FaTimes } from "react-icons/fa";
import 'ol/ol.css';
import './Peta.css'
import { forEachCorner } from "ol/extent";
import { clearRoute } from "../states/map/action";
import { set } from "ol/transform";


const StopwatchAndTimer = React.lazy(() => import("fe_common_tools/StopwatchAndTimer"));

function Peta() {
    // Main
    const GEOSERVER_URL = process.env.GEOSERVER_URL
    const mapRef = useRef();
    const dispatch = useDispatch();
    const [map, setMap] = useState(null);
    const [source] = useState(new VectorSource());
    const [wmsLayer, setWmsLayer] = useState(null);
    const [isLayerVisible, setIsLayerVisible] = useState(true);
    const [currentView, setCurrentView] = useState(new View({
        // center: fromLonLat([-252.38901034, -6.92513522]), // Bandung
        center: fromLonLat([-122.44353, 47.277627]), // S57
        zoom: 12.75
    }));

    // Route Planning
    const [startPoint, setStartPoint] = useState("");
    const [endPoint, setEndPoint] = useState("");
    const [isSelectingStart, setIsSelectingStart] = useState(false);
    const [isSelectingEnd, setIsSelectingEnd] = useState(false);
    const [safePriorityRate, setSafePriorityRate] = useState(null);
    const [distancePriorityRate, setDistancePriorityRate] = useState(null);
    const [routeLayer, setRouteLayer] = useState(null);
    const [routePointType, setRoutePointType] = useState(null);
    const [currLocCoords, setCurrLocCoords] = useState(null);
    const swapStatus = useSelector((state) => state.globalState.isSwapClicked);
    const routeLonLat = useSelector((state) => state.layers.route);
    const s57Data = useSelector((state) => state.layers.s57);
    const isNodeValid = useSelector((state) => state.globalState.isNodeValid);
    const isNewRoute = useSelector((state) => state.globalState.isNewRoute);

    // Misc
    const dragBoxRef = useRef(null); // Ref to store the DragBox interaction
    const [isZooming, setIsZooming] = useState(false);
    const [draw, setDraw] = useState(null);
    const [select, setSelect] = useState(null);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [selectedColor, setSelectedColor] = useState('#FF5733');
    const [showQEK, setShowQEK] = useState(false);
    const [trackType, setTrackType] = useState(null);
    const [showTimerModal, setShowTimerModal] = useState(false);
    const [showStopwatchModal, setShowStopwatchModal] = useState(false);

    // Broadcast Channel
    const [drawnObjectList, setDrawnObjectList] = useState([]);
    const [lastUpdateType, setLastUpdateType] = useState(null);
    const [deleteTracksType, setDeleteTracksType] = useState(null);
    const [isSender, setIsSender] = useState(false);
    const channel = new BroadcastChannel('mapActions');

    //Add Route to Map
    const addRouteLayer = (map, coordinates) => {
        if (routeLonLat.message === "No route found") {
            toast.error("No route found. Please try again", {
                position: "bottom-left",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                icon: <BsFillExclamationCircleFill className="w-6 h-6" />,
                closeButton: <FaTimes style={{ color: "black" }} className="w-6 h-6" />,
            });
            return;
        }
        const transformedCoordinates = coordinates.map(coord => fromLonLat(coord));

        const routeFeature = new Feature({
            geometry: new MultiLineString([transformedCoordinates]),
        }); 

        const routeStyle = new Style({
            stroke: new Stroke({
                color: '#ff6a6a', // Dark red color for the main line
                width: 4,
            }),
        });

        const routeBorderStyle = new Style({
            stroke: new Stroke({
                color: '#e30000', // Soft border with some transparency
                width: 8,
            }),
        });

        routeFeature.setStyle([routeBorderStyle, routeStyle]);

        const vectorSource = new VectorSource({
            features: [routeFeature],
        });

        const vectorLayer = new VectorLayer({
            source: vectorSource,
            properties: {
                name: 'Route Layer',
            },
        });

        map.addLayer(vectorLayer);
    };

    //Get S57 Layer
    const olWmsLayer = new TileLayer({
        source: new TileWMS({
            url: `${GEOSERVER_URL}/wms`,
            params: {
                'LAYERS': 's57-tugas-akhir:s57-tugas-akhir', // Your layer group name
                'TILED': true,
                'VERSION': '1.1.1',
                'FORMAT': 'image/png'
            },
            serverType: 'geoserver'
        }),
        opacity: 0.7
    });


    useEffect(() => {
        channel.postMessage({ drawnObjectList, lastUpdateType, deleteTracksType });
    }, [drawnObjectList, deleteTracksType])

    // User Current Location
    const geolocation = new Geolocation({
        trackingOptions: {
            enableHighAccuracy: true,
        },
        projection: currentView.getProjection(),
    });

    const accuracyFeature = new Feature();
    geolocation.on('change:accuracyGeometry', function () {
        accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
    });

    const positionFeature = new Feature();
    positionFeature.setStyle(
        new Style({
            image: new CircleStyle({
                radius: 6,
                fill: new Fill({
                    color: '#3399CC',
                }),
                stroke: new Stroke({
                    color: '#fff',
                    width: 2,
                }),
            }),
        }),
    );

    geolocation.on('change:position', function () {
        const coordinates = geolocation.getPosition();
        setCurrLocCoords(coordinates);
        positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
    });

    const currLocation = new VectorLayer({
        source: new VectorSource({
            features: [accuracyFeature, positionFeature],
        }),
        properties: {
            name: 'Current Location',
        },
    });

    const getCurrentLocation = () => {
        if (currLocCoords) {
            currentView.setCenter(currLocCoords);
            currentView.setZoom(9);
        }
    };

    const locateS57 = () => {
        currentView.setCenter(fromLonLat([-122.44353, 47.277627]));
        currentView.setZoom(12.75);
    };

    useEffect(() => {
        const olMap = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM()
                }),
                new VectorLayer({
                    source: source
                }),
            ],
            view: currentView
        });

        setMap(olMap);

        // Add the WMS layer to the map
        olMap.addLayer(olWmsLayer);

        // Add the current location layer to the map
        olMap.addLayer(currLocation);
        geolocation.setTracking(true);

        // Save map and layer references to state
        setMap(olMap);
        setWmsLayer(olWmsLayer);

        const ws = new WebSocket('ws://localhost:3000');
        ws.onmessage = function (event) {
            const aisMessage = JSON.parse(event.data);
            const { position } = aisMessage;
            const coords = fromLonLat([position.lon, position.lat]);

            const feature = new Feature({
                geometry: new Point(coords),
            });

            feature.setStyle(
                new Style({
                    image: new CircleStyle({
                        radius: 5,
                        fill: new Fill({ color: 'red' }),
                        stroke: new Stroke({
                            color: 'black',
                            width: 1,
                        }),
                    }),
                })
            );

            source.addFeature(feature);
        };

        channel.onmessage = (event) => {
            let geometry;
            const data = event.data.drawnObjectList[event.data.drawnObjectList.length - 1]
            const lastUpdateType = event.data.lastUpdateType
            const currDeleteTracksType = event.data.deleteTracksType
            if (!isSender && data && lastUpdateType === "add") {
                if (data.type === 'LineString') {
                    geometry = new LineString(data.coords);
                }
                else if (data.type === 'Polygon') {
                    geometry = new Polygon(data.coords);
                }
                else if (data.type === 'Circle') {
                    geometry = new Circle(data.center, data.radius);
                }
                else if (data.type === 'Point') {
                    geometry = new Point(data.coords)
                }
                if (geometry) {
                    const feature = new Feature({
                        geometry: geometry,
                    });
                    if (data.type === 'Point' && data.mode === "QEK") {
                        feature.setStyle(
                            new Style({
                                image: new Icon({
                                    src: data.trackType,
                                    scale: 0.1
                                })
                            })
                        )
                    }
                    else if (data.type === 'Point' && data.mode === "Route") {
                        feature.setStyle(
                            new Style({
                                image: new Icon({
                                    src: data.routeType,
                                    scale: 0.1
                                })
                            })
                        )
                        // if (data.routeType === startIcon) {
                        //     setStartPoint(data.startCoords)
                        // }
                        // if (data.routeType === endIcon) {
                        //     setEndPoint(data.endCoords)
                        // }
                    }
                    source.addFeature(feature);

                }
            }
            else if (!isSender && lastUpdateType === "undo") {
                const feature = source.getFeatures();
                source.removeFeature(feature[feature.length - 1]);
            }
            else if (currDeleteTracksType && lastUpdateType === "delete") {
                const features = source.getFeatures();
                const filteredFeatures = features.filter((feature) => {
                    const style = feature.getStyle();
                    return style && style.getImage() && style.getImage().getSrc() === currDeleteTracksType;
                });
                filteredFeatures.forEach((feature) => source.removeFeature(feature));
                setDeleteTracksType(null);
            }
            setIsSender(false);
        }
        return () => olMap.setTarget(undefined);
    }, [source, currentView]);

    useEffect(() => {
        if (routeLonLat && routeLonLat.route && startPoint && endPoint && isNewRoute === "NEW_ROUTE") {
            addRouteLayer(map, routeLonLat.route);
            dispatch(setIsNewRoute("OLD_ROUTE"))
        }
        if (isNodeValid === "IN LAND AREA" || isNodeValid === "IN SHALLOW DEPTH AREA" || isNodeValid === "IN TOO FAR FROM LAND AREA" || isNodeValid === "IN WRECK AREA" || isNodeValid === "IN OBSTRUCTION AREA" || isNodeValid === "IN BOYAGE AREA" || isNodeValid === "NOT IN S57 AREA") {
            undoDrawing();
            dispatch(setIsNodeValid("VALID"));
        }
    }, [routeLonLat, isNodeValid, startPoint, endPoint, isNewRoute]);

    // Zoom Area Mode
    const startZoomArea = () => {
        const newIsZooming = !isZooming;
        setIsZooming(newIsZooming);

        if (newIsZooming) {
            const dragBox = new DragBox();
            dragBoxRef.current = dragBox; // Store the DragBox interaction in the ref
            map.addInteraction(dragBox);

            dragBox.on('boxend', () => {
                const extent = dragBox.getGeometry().getExtent();
                map.getView().fit(extent, {
                    size: map.getSize(),
                    duration: 250,
                });
            });
        } else {
            if (dragBoxRef.current) {
                map.removeInteraction(dragBoxRef.current);
                dragBoxRef.current = null; // Clear the ref
            }
        }
    };

    // // Select Mode
    // const startSelect = () => {
    //     const newSelect = new Select({
    //         source: [source],
    //     });

    //     newSelect.on('select', (e) => {
    //         if (e.selected.length > 0) {
    //             setSelectedFeature(e.selected[0]);
    //         } else {
    //             setSelectedFeature(null);
    //         }
    //     });

    //     if (select) {
    //         map.getViewport().classList.remove('custom-grab-cursor');
    //         map.removeInteraction(select);
    //         setSelect(null);
    //     }

    //     else if (select === null) {
    //         map.getViewport().classList.add('custom-grab-cursor');
    //         map.addInteraction(newSelect);
    //         setSelect(newSelect);
    //     }
    // };

    // Drawing Methods
    const startDrawing = (type, mode = "") => {
        if (draw) {
            map.removeInteraction(draw);
        }
        const newDraw = new Draw({
            source: source,
            type: type,
        });
        map.addInteraction(newDraw);
        setDraw(newDraw);
        newDraw.on('drawend', (event) => {
            let radius
            let center
            const coords = event.feature.getGeometry().getCoordinates();
            if (type === 'Circle') {
                radius = event.feature.getGeometry().getRadius();
                center = event.feature.getGeometry().getCenter();
            }
            else if (type === "Point" && mode === "QEK") {
                event.feature.setStyle(
                    new Style({
                        image: new Icon({
                            src: trackType,
                            scale: 0.1
                        })
                    })
                );
            }
            else if (type === "Point" && mode === "Route") {
                event.feature.setStyle
                    (new Style({
                        image: new Icon({
                            src: routePointType,
                            scale: 0.15
                        })
                    })
                    );
            }
            const newObj = { startCoords: startPoint, endCoords: endPoint, mode: mode, routeType: routePointType, trackType: trackType, type: type, coords: coords, radius: radius, center: center }
            setLastUpdateType("add")
            setIsSender(true);
            setDrawnObjectList(prevList => [...prevList, newObj]);
        });

    };

    // Stop Drawing
    const stopDrawing = () => {
        if (draw) {
            map.removeInteraction(draw);
            setIsSelectingStart(false);
            setIsSelectingEnd(false);
            setDraw(null);
        }
    };

    // Undo Drawing
    const undoDrawing = () => {
        const features = source.getFeatures();
        const layers = map.getLayers().getArray();
        if (features.length > 0) {
            const lastFeature = features[features.length - 1];

            // Remove the last feature from the source
            source.removeFeature(lastFeature);

            // Update state
            setLastUpdateType("undo");
            setDrawnObjectList(prevList => prevList.slice(0, -1));
            localStorage.removeItem('drawnPolyline');

            // Check if the feature has a style and image
            const style = lastFeature.getStyle();
            if (style && style.getImage && style.getImage()) {
                const src = style.getImage().getSrc();
                if (src === startIcon) {
                    setStartPoint("");
                    layers.forEach(layer => {
                        if (layer.get('name') === 'Route Layer') {
                            map.removeLayer(layer);
                            setStartPoint("");
                            dispatch(clearRoute())
                        }
                    });
                }
                if (src === endIcon) {
                    setEndPoint("");
                    layers.forEach(layer => {
                        if (layer.get('name') === 'Route Layer') {
                            map.removeLayer(layer);
                            setEndPoint("");
                            dispatch(clearRoute())
                        }
                    });
                }
            }
        }

    };

    const storedPolyLine = localStorage.getItem('drawnPolyline');
    if (storedPolyLine) {
        const coords = JSON.parse(storedPolyLine);
        const feature = new Feature({
            geometry: new LineString(coords)
        });
        source.addFeature(feature);
    }

    useEffect(() => {
        if (showQEK && trackType) {
            startDrawing("Point", "QEK");
        } else if (isSelectingStart || isSelectingEnd) {
            startDrawing("Point", "Route");
        } else if (!showQEK || !trackType || !isSelectingStart || !isSelectingEnd) {
            stopDrawing();
        }
    }, [showQEK, trackType, isSelectingStart, isSelectingEnd, swapStatus]);

    const openQEK = () => {
        setShowQEK(!showQEK)
    }

    const openStopwatchAndTimer = (type) => {
        if (type === 'Stopwatch') {
            setShowStopwatchModal(!showStopwatchModal);
        } else if (type === 'Timer') {
            setShowTimerModal(!showTimerModal);
        }
    }

    const changeFeatureColor = (selectedFeature) => {
        const colorArray = asArray(selectedColor)
        if (selectedFeature) {
            selectedFeature.setStyle(
                new Style({
                    fill: new Fill({
                        color: [colorArray[0], colorArray[1], colorArray[2], 0.5],
                    }),
                    stroke: new Stroke({
                        color: selectedColor,
                        width: 3
                    })

                })
            );
        }
        else {
            return
        }
    }

    const toggleLayerVisibility = () => {
        if (wmsLayer) {
            wmsLayer.setVisible(!isLayerVisible);
            setIsLayerVisible(!isLayerVisible);
        }
    };

    const buttonClass = select ? "bg-green-500 hover:bg-green-700 text-white p-2 rounded m-1 mr-1" : "bg-primary hover:bg-dark-primary text-white p-2 rounded m-1 mr-1";
    return (

        <div className="w-full h-full">
            <div>
                <div ref={mapRef} className="absolute top-0 left-0 right-0 bottom-0" />
                {/*Top Left Route Planning Section*/}
                <RoutePlanning
                    undoDrawing={undoDrawing}
                    stopDrawing={stopDrawing}
                    s57Data={s57Data}
                    source={source}
                    isSelectingStart={isSelectingStart}
                    isSelectingEnd={isSelectingEnd}
                    setIsSelectingStart={setIsSelectingStart}
                    setIsSelectingEnd={setIsSelectingEnd}
                    safePriorityRate={safePriorityRate}
                    setSafePriorityRate={setSafePriorityRate}
                    distancePriorityRate={distancePriorityRate}
                    setDistancePriorityRate={setDistancePriorityRate}
                    routeLayer={routeLayer}
                    setRouteLayer={setRouteLayer}
                    startPoint={startPoint}
                    endPoint={endPoint}
                    setStartPoint={setStartPoint}
                    setEndPoint={setEndPoint}
                    map={map}
                    setRoutePointType={setRoutePointType}
                />
                {/*Top Right Section*/}
                <div className="absolute right-0 top-0 mt-2 mr-3 space-y-2">
                    <button onClick={() => toggleLayerVisibility()} className="bg-primary-container hover:bg-high-container text-white p-2 rounded m-1 mr-1"> {isLayerVisible ? 'Hide S-57 Layer' : 'Show S-57 Layer'} </button>
                    <button onClick={() => openQEK()} className="bg-primary-container hover:bg-high-container text-white p-2 rounded m-1 mr-1">QEK</button>
                    <button onClick={() => openStopwatchAndTimer("Stopwatch")} className="bg-primary-container hover:bg-high-container text-white p-2 rounded m-1 mr-1">Stopwatch</button>
                    <button onClick={() => openStopwatchAndTimer("Timer")} className="bg-primary-container hover:bg-high-container text-white p-2 rounded m-1 mr-1">Timer</button>
                </div>
                {/*Bottom Right Section*/}
                <div className="absolute right-0 bottom-0 mb-4 mr-3 space-y-2">
                    <div className="flex items-center ">
                        <button onClick={locateS57} className="bg-primary-container hover:bg-high-container text-white p-2 rounded m-1 mr-1 text-center">Locate S57</button>
                        <button onClick={startZoomArea} className={`  text-white p-2 rounded m-1 mr-1 ${isZooming ? "bg-red-500 hover:bg-red-700" : "bg-primary-container hover:bg-high-container"}`}>{isZooming ? "Cancel Zoom" : "Zoom Area"}</button>
                        <button onClick={getCurrentLocation} className="bg-primary-container hover:bg-high-container text-white p-3 rounded m-1 mr-1 text-center"><BiCurrentLocation size={18} /></button>
                        {draw ? <button onClick={stopDrawing} className="bg-red-500 hover:bg-red-700 text-white p-2 rounded m-1">Cancel </button> : null}
                    </div>
                    {/* {selectedFeature && select === null ?
                        (<input className="bg-white-200 text-white rounded p-1 mr-2"
                            type="color"
                            value={selectedColor}
                            onChange={(e) => {
                                setSelectedColor(e.target.value);
                                changeFeatureColor(selectedFeature)
                            }}
                        />) : null} */}

                    {/* <button onClick={startSelect} className={buttonClass}>{select ? "Confirm Select" : "Select"}</button> */}
                    {/* <button onClick={() => startDrawing("Circle")} className="bg-primary-container hover:bg-high-container text-white p-2 rounded m-1 mr-1">Circle</button>
                    <button onClick={() => startDrawing("LineString")} className="bg-primary-container hover:bg-high-container text-white p-2 rounded m-1">Line</button> */}
                </div>
            </div>
            <div className="flex justify-center items-center">
                {showStopwatchModal && (
                    <div className="z-auto">
                        <React.Suspense fallback="Loading...">
                            <StopwatchAndTimer handleClose={() => openStopwatchAndTimer("Stopwatch")} type={"Stopwatch"} />
                        </React.Suspense>
                    </div>
                )}
                {showTimerModal && (
                    <div className="z-auto">
                        <React.Suspense fallback="Loading...">
                            <StopwatchAndTimer handleClose={() => openStopwatchAndTimer("Timer")} type="Timer" />
                        </React.Suspense>
                    </div>
                )}
                {showQEK && (
                    <React.Suspense fallback="Loading...">
                        <QEK handleClose={openQEK} trackType={trackType} setTrackType={setTrackType} setDeleteTracksType={setDeleteTracksType} setLastUpdateType={setLastUpdateType} />
                    </React.Suspense>
                )}
            </div>
        </div>
    );
}

export default Peta;