const api = (() => {
    const GEOSERVER_URL = process.env.GEOSERVER_URL
    const API_URL = process.env.API_URL


    async function getS57MapGroup() {
        try {
            const response = await fetch(`${GEOSERVER_URL}/s57-tugas-akhir/wms?service=WMS&version=1.1.0&request=GetMap&layers=s57-tugas-akhir:s57-tugas-akhir&outputFormat=application%2Fopenlayers`)
            console.log(response)
            return response
        } catch (error) {
            console.error("Error fetching data:", error)

        }
    }

    async function getRoute(startPoint, endPoint, minimumDepth, maxDistanceFromLand, neighborDistance, signal) {
        try {
            const response = await fetch(`${API_URL}/route`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    start: startPoint,
                    end: endPoint,
                    minimumDepth: minimumDepth,
                    maxDistanceFromLand: maxDistanceFromLand,
                    neighborDistance: neighborDistance,
                }),
                signal
            });
            const data = await response.json();
            console.log(data)
            return data
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request was aborted');
            } else {
                console.error('Error:', error);
            }
        }
    }

    async function getS57Layers() {
        try {
            const response = await fetch(`${API_URL}/s57-layers`)
            const data = await response.json();
            return data.features
        } catch {
            console.error("Error fetching data:", error)
        }
    }

    return {
        getS57Layers,
        getS57MapGroup,
        getRoute,
    }
})();

export default api