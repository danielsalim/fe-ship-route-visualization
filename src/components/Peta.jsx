import { setIsNodeValid, setIsNewRoute } from '../states/global/action';
import { BsFillExclamationCircleFill } from "react-icons/bs";
import React, { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Fill, Icon, Stroke, Style } from 'ol/style';
import { Circle as CircleStyle } from 'ol/style.js';
import { BiCurrentLocation } from "react-icons/bi";
import { clearRoute } from "../states/map/action";
import { defaults } from 'ol/control/defaults';
import { FaSquare } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";
import { Feature, Map, View } from 'ol';
import { toast } from 'react-toastify';
import { fromLonLat } from 'ol/proj';

import MultiLineString from 'ol/geom/MultiLineString.js';
import startIcon from '../assets/RiShip2Line.svg';
import endIcon from '../assets/FaLocationDot.svg';
import DragBox from 'ol/interaction/DragBox';
import LineString from 'ol/geom/LineString';
import VectorSource from 'ol/source/Vector';
import RoutePlanning from './RoutePlanning';
import Geolocation from 'ol/Geolocation.js';
import VectorLayer from 'ol/layer/Vector';
import TileWMS from 'ol/source/TileWMS';
import Draw from 'ol/interaction/Draw';
import TileLayer from 'ol/layer/Tile';
import Point from "ol/geom/Point";
import OSM from 'ol/source/OSM';

import 'react-toastify/dist/ReactToastify.css';
import './Peta.css'
import 'ol/ol.css';

import BoylatIcon from "../assets/s57_png/BOYLAT.png"
import WrecksIcon from "../assets/s57_png/WRECKS.png"
import LightsIcon from "../assets/s57_png/LIGHTS.png"
import ObstrnIcon from "../assets/s57_png/OBSTRN.png"


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
        center: fromLonLat([-122.44353, 47.277627]), // S57
        zoom: 12.75
    }));

    // Route Planning
    const [startPoint, setStartPoint] = useState("");
    const [endPoint, setEndPoint] = useState("");
    const [isSelectingStart, setIsSelectingStart] = useState(false);
    const [isSelectingEnd, setIsSelectingEnd] = useState(false);
    const [routePointType, setRoutePointType] = useState(null);
    const [showLegend, setShowLegend] = useState(true)
    const swapStatus = useSelector((state) => state.globalState.isSwapClicked);
    const isNodeValid = useSelector((state) => state.globalState.isNodeValid);
    const isNewRoute = useSelector((state) => state.globalState.isNewRoute);

    // Misc
    const [isZooming, setIsZooming] = useState(false);
    const [draw, setDraw] = useState(null);

    //Add Route to Map
    const routeLonLat = useSelector((state) => state.layers.route);

    const addRouteLayer = (map, coordinates) => {
        if (routeLonLat.message) {
            toast.error(routeLonLat.message, {
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

    //Get S57 Layer Image from Geoserver
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

    // User Current Location
    const [currLocCoords, setCurrLocCoords] = useState(null);

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

    const toggleLegend = () => {
        setShowLegend(!showLegend);
    }

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
            view: currentView,
            controls: defaults({
                attribution: false,
                zoom: false,
            }),
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
        return () => olMap.setTarget(undefined);
    }, [source, currentView]);

    useEffect(() => {
        if (routeLonLat && routeLonLat.route && startPoint && endPoint && isNewRoute === "NEW_ROUTE") {
            addRouteLayer(map, routeLonLat.route);
            dispatch(setIsNewRoute("OLD_ROUTE"))
        }
        if (isNodeValid === "IN LAND AREA" || isNodeValid === "IN SHALLOW DEPTH AREA" || isNodeValid === "IN TOO NEAR FROM LAND AREA" || isNodeValid === "IN TOO FAR FROM LAND AREA" || isNodeValid === "IN WRECK AREA" || isNodeValid === "IN OBSTRUCTION AREA" || isNodeValid === "IN BOYAGE AREA" || isNodeValid === "NOT IN S57 AREA") {
            undoDrawing();
            dispatch(setIsNodeValid("VALID"));
        }
    }, [routeLonLat, isNodeValid, startPoint, endPoint, isNewRoute]);

    // Zoom Area Mode
    const dragBoxRef = useRef(null); // Ref to store the DragBox interaction

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
            if (type === "Point" && mode === "Route") {
                event.feature.setStyle
                    (new Style({
                        image: new Icon({
                            src: routePointType,
                            scale: 0.15
                        })
                    })
                    );
            }
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
        if (isSelectingStart || isSelectingEnd) {
            startDrawing("Point", "Route");
        } else if (!isSelectingStart || !isSelectingEnd) {
            stopDrawing();
        }
    }, [isSelectingStart, isSelectingEnd, swapStatus]);

    const toggleLayerVisibility = () => {
        if (wmsLayer) {
            wmsLayer.setVisible(!isLayerVisible);
            setIsLayerVisible(!isLayerVisible);
        }
    };

    return (
        <div className="w-full h-full">
            <div>
                <div ref={mapRef} className="absolute top-0 left-0 right-0 bottom-0" />
                {/*Top Left Route Planning Section*/}
                <RoutePlanning
                    undoDrawing={undoDrawing}
                    isSelectingStart={isSelectingStart}
                    isSelectingEnd={isSelectingEnd}
                    setIsSelectingStart={setIsSelectingStart}
                    setIsSelectingEnd={setIsSelectingEnd}
                    setRoutePointType={setRoutePointType}
                    startPoint={startPoint}
                    endPoint={endPoint}
                    setStartPoint={setStartPoint}
                    setEndPoint={setEndPoint}
                    map={map}
                />
                {/*Top Right Section*/}
                <div className="absolute right-0 top-0 mt-2 mr-3 space-y-2">
                    <div className="flex justify-end">
                        <button className="cursor-pointer bg-primary-container hover:bg-high-container text-white p-2 rounded m-1 mr-1" onClick={toggleLegend}>
                            {/* <MdArrowDropDown size={12} width={5} height={5} className="text-white" /> */}
                            <p className="text-white text">{showLegend ? "Hide Legend" : "Show Legend"}</p>
                        </button>
                    </div>
                    {showLegend && (
                        <div className="w-52 bg-primary-container text-sm flex flex-col border-2 border-blue-300 rounded-md space-y-4 p-4 mt-2 mr-1">
                            <div className="flex" title="A lateral buoy is used to indicate the port or starboard hand side of the route to be followed.">
                                <img src={BoylatIcon} className="w-4 h-4 mr-5" />
                                <span className="text-white text-left">Lateral Buoy</span>
                            </div>
                            <div className="flex" title="The ruined remains of a stranded or sunken vessel which has been rendered useless.">
                                <img src={WrecksIcon} className="w-4 h-4 mr-5" />
                                <span className="text-white text-left">Wreckage</span>
                            </div>
                            <div className="flex" title="A luminous or lighted aid to navigation.">
                                <img src={LightsIcon} className="w-4 h-4 mr-5" />
                                <span className="text-white text-left">Light Tower</span>
                            </div>
                            <div className="flex" title="In marine navigation, anything that hinders or prevents movement, particularly anything that endangers or prevents passage of a vessel.&#10; The term is usually used to refer to an isolated danger to navigation, such as a sunken rock or pinnacle.">
                                <img src={ObstrnIcon} className="w-4 h-4 mr-5" />
                                <span className="text-white text-left">Obstruction</span>
                            </div>
                            <div className="flex ">
                                <FaSquare style={{ color: "#CDE8BC" }} className="w-4 h-4 mr-5" />
                                <span className="text-white text-left">-3.3 &lt; Depth &lt;= 0</span> {/* Depth -3.3 - 0 */}
                            </div>
                            <div className="flex ">
                                <FaSquare style={{ color: "#73B6EF" }} className="w-4 h-4 mr-5" />
                                <span className="text-white text-left">0 &lt; Depth &lt;= 3</span>  {/* Depth 0 - 3 */}
                            </div>
                            <div className="flex ">
                                <FaSquare style={{ color: "#98C5F2" }} className="w-4 h-4 mr-5" />
                                <span className="text-white text-left">3 &lt; Depth &lt;= 6</span> {/* Depth 3 - 6 */}
                            </div>
                            <div className="flex ">
                                <FaSquare style={{ color: "#BAD5E1" }} className="w-4 h-4 mr-5" />
                                <span className="text-white text-left">6 &lt; Depth &lt;= 9</span> {/* Depth 6 - 9 */}
                            </div>
                            <div className="flex ">
                                <FaSquare style={{ color: "#D4EAEE" }} className="w-4 h-4 mr-5" />
                                <span className="text-white text-left">&gt;= 9.1 Depth</span> {/* Depth >= 9.1 */}
                            </div>
                            <div className="flex" title="The solid portion of the Earth's surface, as opposed to sea, water.">
                                <FaSquare style={{ color: "#ccc57b" }} className="w-4 h-4 mr-5" />
                                <span className="text-white text-left">Land Area</span> {/* Depth >= 9.1 */}
                            </div>
                        </div>
                    )}
                </div>
                {/*Bottom Right Section*/}
                <div className="absolute right-0 bottom-0 mb-4 mr-3 space-y-2">
                    <div className="flex items-center ">
                        <button onClick={() => toggleLayerVisibility()} className="bg-primary-container hover:bg-high-container text-white p-2 rounded m-1 mr-1"> {isLayerVisible ? 'Hide S-57 Layer' : 'Show S-57 Layer'} </button>
                        <button onClick={startZoomArea} className={`  text-white p-2 rounded m-1 mr-1 ${isZooming ? "bg-red-500 hover:bg-red-700" : "bg-primary-container hover:bg-high-container"}`}>{isZooming ? "Cancel Zoom" : "Zoom Area"}</button>
                        <button onClick={locateS57} className="bg-primary-container hover:bg-high-container text-white p-2 rounded m-1 mr-1 text-center">Locate Route Area</button>
                        <button onClick={getCurrentLocation} title="Locate Your Area" className="bg-primary-container hover:bg-high-container text-white p-3 rounded m-1 mr-1 text-center"><BiCurrentLocation size={18} /></button>
                        {draw ? <button onClick={stopDrawing} className="bg-red-500 hover:bg-red-700 text-white p-2 rounded m-1">Cancel </button> : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Peta;