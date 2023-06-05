import React, { useState, useEffect, useMemo, useRef } from 'react'
import { getSession, useSession } from "next-auth/react"
import dynamic from "next/dynamic"
import { PlayCircleOutline, PauseCircleOutline, SearchOutline, ArrowForwardCircleOutline } from 'react-ionicons'
import { toast } from 'react-toastify';

import SignIn from '../components/SignIn';
import Audio from '../components/Audio';
import AppHeader from '../components/AppHeader';

const TinderCard = dynamic(() => import('../libs/react-tinder-card.js'), {
  ssr: false
});
const SPOTIFY_LIMIT = 50;

export default function Home({connected, pre_tracks}) {
    const [numberOfPages, setNumberOfPages] = useState(0);
    const [playlistTracks, setPlaylistTracks] = useState([]);
    const [passedTracks, setPassedTracks] = useState([]);
    const [allTracks, setAllTracks] = useState([]);
    const [total, setTotal] = useState(0);

    const [searchByUrl, setSearchByUrl] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFinish, setIsFinish] = useState(false);
    const [started, setStarted] = useState(false);
    const [appMode, setAppMode] = useState(null);
    const [displayBgCover, setDisplayBgCover] = useState(null);
    const [playlistName, setPlaylistName] = useState('My Custom Playlist');

    const { data: session } = useSession()

    const [currentIndex, setCurrentIndex] = useState(0)
    const currentIndexRef = useRef(currentIndex)
    const childRefs = useMemo(
        () =>
            total ? 
                Array(total)
                    .fill(0)
                    .map((i) => React.createRef()) 
            : 
                0,
        [started]
    )

    /**
     * Method part
     */
    // Fetch Spotify Web API
    async function fetchWebApi(endpoint, method, body) {
        const res = await fetch(`https://api.spotify.com/${endpoint}`, {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
            },
            method,
            body:JSON.stringify(body)
        });
        return await res.json();
    }

    // Start the app
    const startApp = async (mode) => {
        setStarted(true);
        setIsPlaying(true);
        setAppMode(mode);
        
        let _allTracks = [];

        // Si c'est en mode playlist
        if(mode == 'playlist'){
            async function search_playlist_by_id(){
                return (await fetchWebApi(
                    `v1/playlists/${searchByUrl.id}`, 'GET'
                    ));
            }

            // Search playlist
            const founded_playlist = await search_playlist_by_id();
            if(founded_playlist.error){
                console.log('erreur en start app');
            }else{
                _allTracks = founded_playlist.tracks.items.map(({ track }, index) => ({
                    position: (index + 1),
                    id: track.id,
                    uri: track.uri,
                    name: track.name,
                    preview_url: track.preview_url,
                    artists: track.artists.map(artist => artist.name).join(', '),
                    cover: track.album.images[0].url,
                }));

                setAllTracks(_allTracks)
                setNumberOfPages((founded_playlist && founded_playlist.tracks.total) ? Math.ceil(founded_playlist.tracks.total / SPOTIFY_LIMIT) : 0);
                setTotal(founded_playlist.tracks.total)
                setCurrentPage((founded_playlist.tracks.total <= SPOTIFY_LIMIT) ? 1 : 2);
            }
        }

        // Si c'est en mode saved_tracks
        if(mode == 'saved_tracks'){
            async function getSpotifySavedTracks(url){
                return await fetchWebApi(url, 'GET');
            }
            const spotify_savedTracks = await getSpotifySavedTracks(`v1/me/tracks?offset=0&limit=${SPOTIFY_LIMIT}`);
            if(spotify_savedTracks.error){
                console.log('erreur en start app');
            }

            _allTracks = spotify_savedTracks.items.map(({ track }, index) => ({
                position: (index + 1),
                id: track.id,
                uri: track.uri,
                name: track.name,
                preview_url: track.preview_url,
                artists: track.artists.map(artist => artist.name).join(', '),
                cover: track.album.images[0].url,
            }));

            setAllTracks(_allTracks)
            setNumberOfPages((spotify_savedTracks && spotify_savedTracks.total) ? Math.ceil(spotify_savedTracks.total / SPOTIFY_LIMIT) : 0);
            setTotal(spotify_savedTracks.total)
            setCurrentPage(1);
        }

        const track = _allTracks[0];
        if((track)){
            if(track && track.preview_url){
                document.getElementById('preview-music').setAttribute('src', track.preview_url);
                document.getElementById('preview-music').play();
                document.getElementById('preview-music').volume = 0.05;
            }
        }
    }

    // Load more music
    const loadMore = async () => {
        if(appMode == 'saved_tracks'){
            async function getSavedTracks(){
                return (await fetchWebApi(
                    `v1/me/tracks?market=FR&limit=${SPOTIFY_LIMIT}&offset=${SPOTIFY_LIMIT * currentPage}`, 'GET'
                    ));
            }
        
            const savedTracks = await getSavedTracks();
    
            if(savedTracks.error){
                console.log('error on load more');
            }else{
                let _savedTracks = savedTracks.items.map(({ track }, index) => ({
                    position: (index + 1) + (SPOTIFY_LIMIT * currentPage),
                    id: track.id,
                    uri: track.uri,
                    name: track.name,
                    preview_url: track.preview_url,
                    artists: track.artists.map(artist => artist.name).join(', '),
                    cover: track.album.images[0].url,
                }));
        
                setAllTracks([...allTracks, ..._savedTracks])
    
                // Play preview
                const track = [...allTracks, ..._savedTracks][SPOTIFY_LIMIT * currentPage];
    
                if((track)){
                    if(track && track.preview_url){
                        document.getElementById('preview-music').setAttribute('src', track.preview_url);
                        document.getElementById('preview-music').play();
                    }
                }
    
                setIsPlaying(true);
                setCurrentPage(currentPage + 1)
            }
        }

        else if(appMode == 'playlist'){
            async function getPlaylistSavedTracks(){
                return (await fetchWebApi(
                    `v1/playlists/${(searchByUrl) ? searchByUrl.id : ''}/tracks?offset=${(50 * currentPage - 1) + 1}&limit=50`, 'GET'
                    ));
            }
        
            const savedTracks = await getPlaylistSavedTracks();
    
            if(savedTracks.error){
                console.log('error on load more');
            }else{
                if(savedTracks.items && savedTracks.items.length == 0){
                    setIsPlaying(false);
                    setIsFinish(true);
                    document.getElementById('preview-music').pause();
                }else{
                    let _savedTracks = savedTracks.items.map(({ track }, index) => ({
                        position: (index + 1) + ((currentPage == 2 ? 100 : 50 * currentPage)),
                        id: track.id,
                        uri: track.uri,
                        name: track.name,
                        preview_url: track.preview_url,
                        artists: track.artists.map(artist => artist.name).join(', '),
                        cover: track.album.images[0].url,
                    }));
            
                    setAllTracks([...allTracks, ..._savedTracks])
        
                    // Play preview
                    const track = [...allTracks, ..._savedTracks][((currentPage == 2 ? 100 : 50 * currentPage))];
        
                    if((track)){
                        if(track && track.preview_url){
                            document.getElementById('preview-music').setAttribute('src', track.preview_url);
                            document.getElementById('preview-music').play();
                        }
                    }
        
                    setIsPlaying(true);
                    setCurrentPage(currentPage + 1)
                }
                
            }
        }
    }

    // Play preview music
    const togglePreview = () => {
        const track = allTracks[(currentIndex) ? currentIndex : 0];
        
        if(isPlaying){
            document.getElementById('preview-music').pause();
            setIsPlaying(false);
        }else{
            if(track && track.preview_url){
                document.getElementById('preview-music').setAttribute('src', track.preview_url);
                document.getElementById('preview-music').play();
                setIsPlaying(true);
            }else{
                document.getElementById('preview-music').pause();
                setIsPlaying(false);

                toast.warn('There\'s nothing to listen to here', {
                    position: "top-center",
                    autoClose: 2000,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    theme: "colored",
                });
            }
        }
        
    }

    // Swiped functions
    const swiped = async (direction, index) => {
        const track = allTracks[index];
        const next_track = allTracks[index + 1];

        if((track) && !passedTracks.includes(track.uri)){
            // On stock un tableau des musiques passées pour éviter les duplication
            const passed_arr = passedTracks;
            passed_arr.push(track.uri);
            setPassedTracks(passed_arr);

            // Pas de suite -> On check le load more
            if(!next_track){
                await loadMore();
            }

            // On met à jour l'index pour la musique suivante
            updateCurrentIndex(track.position)

            // If liked
            if(direction == "right"){
                const arr = playlistTracks;
                if(!arr.find((el) => el.uri == track.uri)){
                    arr.push(track);
                    setPlaylistTracks(arr);
                }
            }

            // On joue la prochaine musique
            if(next_track && next_track.preview_url){
                document.getElementById('preview-music').setAttribute('src', next_track.preview_url);
                document.getElementById('preview-music').play();
                setIsPlaying(true);
            }else{
                if(next_track && !next_track.preview_url){
                    document.getElementById('preview-music').pause();
                    setIsPlaying(false);

                    toast.warn('There\'s nothing to listen to here', {
                        position: "top-center",
                        autoClose: 2000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: false,
                        draggable: true,
                        progress: undefined,
                        theme: "colored",
                    });
                        
                }
            }

            // On clean le childRefs
            // childRefs.shift()
        }
    }

    const updateCurrentIndex = (val) => {
        setCurrentIndex(val)
        currentIndexRef.current = val
    }

    useEffect(() => {
        setDisplayBgCover(displayCoverBackground());
    }, []);

    function shuffleArr (array){
        for (var i = array.length - 1; i > 0; i--) {
            var rand = Math.floor(Math.random() * (i + 1));
            [array[i], array[rand]] = [array[rand], array[i]]
        }
        return array
    }

    // Display a random cover tracks in background
    const displayCoverBackground = () => {
        if(pre_tracks && pre_tracks.length > 1){
            const covers = shuffleArr(pre_tracks.map((track, index) => ({
                cover: track.cover,
            })));

            return (
                <>
                    <div className='bg-gradient-to-b from-[#1E073B] to-primary-900 w-full h-full absolute z-0 '>
                        <div>
                            <div className={`m-auto left-0 right-0 absolute -top-[4rem] flex justify-center gap-[4rem]`}>
                                <div data-cover-position="1" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[0] && covers[0].cover) ? covers[0].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="2" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[1] && covers[1].cover) ? covers[1].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        
                            <div className={`m-auto -left-[0rem] top-[4rem] absolute flex justify-center gap-[4rem] w-full`}>
                                <div data-cover-position="3" className='opacity-50 bg-cover bg-center h-32 w-32 absolute -left-[2rem] rounded-full' style={{ backgroundImage: `url(${(covers[2] && covers[2].cover) ? covers[2].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="4" className='opacity-50 bg-cover bg-center h-32 w-32 absolute rounded-full' style={{ backgroundImage: `url(${(covers[3] && covers[3].cover) ? covers[3].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="5" className='opacity-50 bg-cover bg-center h-32 w-32 absolute -right-[2rem] rounded-full' style={{ backgroundImage: `url(${(covers[4] && covers[4].cover) ? covers[4].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        </div>

                        <div>
                            <div className={`m-auto left-0 right-0 absolute top-[12rem] flex justify-center gap-[4rem]`}>
                                <div data-cover-position="6" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[5] && covers[5].cover) ? covers[5].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="7" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[6] && covers[6].cover) ? covers[6].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        
                            <div className={`m-auto -left-[0rem] top-[20rem] absolute flex justify-center gap-[4rem] w-full`}>
                                <div data-cover-position="8" className='opacity-50 bg-cover bg-center h-32 w-32 absolute -left-[2rem] rounded-full' style={{ backgroundImage: `url(${(covers[7] && covers[7].cover) ? covers[7].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="9" className='opacity-50 bg-cover bg-center h-32 w-32 absolute rounded-full' style={{ backgroundImage: `url(${(covers[8] && covers[8].cover) ? covers[8].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="10" className='opacity-50 bg-cover bg-center h-32 w-32 absolute -right-[2rem] rounded-full' style={{ backgroundImage: `url(${(covers[9] && covers[9].cover) ? covers[9].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        </div>

                        <div>
                            <div className={`m-auto left-0 right-0 absolute top-[28rem] flex justify-center gap-[4rem]`}>
                                <div data-cover-position="11" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[10] && covers[10].cover) ? covers[10].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="12" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[11] && covers[11].cover) ? covers[11].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        
                            <div className={`m-auto -left-[0rem] top-[36rem] absolute flex justify-center gap-[4rem] w-full`}>
                                <div data-cover-position="13" className='opacity-50 bg-cover bg-center h-32 w-32 absolute -left-[2rem] rounded-full' style={{ backgroundImage: `url(${(covers[12] && covers[12].cover) ? covers[12].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="14" className='opacity-50 bg-cover bg-center h-32 w-32 absolute rounded-full' style={{ backgroundImage: `url(${(covers[13] && covers[13].cover) ? covers[13].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="15" className='opacity-50 bg-cover bg-center h-32 w-32 absolute -right-[2rem] rounded-full' style={{ backgroundImage: `url(${(covers[14] && covers[14].cover) ? covers[14].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        </div>
                        <div className="absolute bottom-0 w-full h-full flex justify-between px-6 pb-6 gradientback"></div>
                    </div>
                </>
            )
        }
    }

    // Search a playlist from Url
    const searchPlaylist = async () => {
        const searchedId = document.getElementById('search_playlist').value;
        if(searchedId){
            const regex = /^.*\/(playlist)\/|\?.*/;
            let processedUrl = searchedId.replace(regex, "");
            processedUrl = (processedUrl.includes("?")) ? processedUrl.substr(0, processedUrl.lastIndexOf("?")) : processedUrl;
            
            async function search_playlist_by_id(){
                return (await fetchWebApi(
                    `v1/playlists/${processedUrl}`, 'GET'
                    ));
            }

            // Search playlist
            const founded_playlist = await search_playlist_by_id();
            if(founded_playlist.error){
                setSearchByUrl(null)
            }else{
                setSearchByUrl(founded_playlist)
                setAppMode('playlist')
            }
        }else{
            setSearchByUrl(null)
        }
    }

    /**
     * Render part
     */
    if(connected == false) {
        return <SignIn />

    // Si l'user est connecté
    }else{
        return (
            <>
                <Audio />
            
                {/* Tracks part*/}
                <div className="relative bg-[#1E073B] h-[calc(100dvh)] w-screen inset-0 select-none" style={{ height: "-webkit-fill-available" }}>
                    <div className="mx-auto max-w-lg bg-[#1E073B] h-full">
                        <div className='relative w-full h-[calc(100dvh)] overflow-hidden'>
                            
                            {/* Heading part  */}
                            <AppHeader 
                                fetchWebApi={fetchWebApi}
                                session={session} 
                                started={started} 
                                playlistTracks={playlistTracks ? playlistTracks : []} 
                                playlistName={playlistName}
                                setPlaylistName={setPlaylistName}
                                setPassedTracks={setPassedTracks}
                                setPlaylistTracks={setPlaylistTracks}
                            />
        
                            {started ? 
                                <>
                                    <div className='absolute w-full h-full flex items-center justify-center'>
                                        {
                                            currentPage < numberOfPages && !isFinish ? <>
                                                <div role="status">
                                                    <svg aria-hidden="true" className="w-8 h-8 mr-2 animate-spin text-primary-700 fill-primary-700" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                                                    </svg>
                                                    <span className="sr-only font-powergrotesk">Loading...</span>
                                                </div>
                                            </> : <p className='text-primary-700 font-powergrotesk'> You&apos;ve reached the end</p>
                                        }

                                        {
                                            isFinish ? <>
                                                <div>
                                                    <button data-modal-target="playlistModal" data-modal-toggle="playlistModal" className={`${(!isFinish ? '' : 'hidden')} flex items-center bg-primary-600 rounded-full p-2`} type="button">
                                                        Relancer une playlist
                                                    </button>
                                                </div>
                                            </> : ''
                                        }
                                    </div>
        
                                    {allTracks ? 
                                        allTracks.map((item, index) => (
                                            <TinderCard 
                                                className={`swipe absolute m-auto left-0 right-0 w-full h-full`}
                                                key={index}
                                                onSwipe={(dir) => swiped(dir, index)} 
                                                zindex={total - index}
                                                preventSwipe={["up", "down"]}
                                                swipeRequirementType="position"
                                                swipeThreshold={100}
                                            >
                                                <div ref={childRefs[item.position]} data-title={item.name} className={`w-full h-full relative overflow-hidden bg-cover bg-center`} style={{ backgroundImage: `url(${item.cover})` }}>
                                                    <div className="absolute bottom-0 w-full flex justify-between px-6 pb-6 pt-28 gradientback bg-white">
                                                        <div className="">
                                                            <span className="block font-semibold text-primary-600 text-3xl font-powergrotesk">{item.name}</span>
                                                            <span className="block italic text-lg font-medium font-powergrotesk">{item.artists}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TinderCard>
                                        ))
                                    :
                                        <>No favorite music</>
                                    }
        
                                    {/* Play button */}
                                    {( SPOTIFY_LIMIT * currentPage !== currentIndex) ? 
                                        <div className='absolute z-[99998] w-100 w-full bottom-0'>
                                            <div className='flex justify-between px-6 pb-6 mt-4'>
                                                <div></div>
                                                <button className="p-0" onClick={() => togglePreview()}>
                                                    {!isPlaying ? 
                                                        <PlayCircleOutline
                                                            color={'#FFF'}
                                                            height={'32px'}
                                                            width={'32px'}
                                                        />
                                                    :
                                                        <PauseCircleOutline
                                                            color={'#FFF'}
                                                            height={'32px'}
                                                            width={'32px'}
                                                        />
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    :  ''}
                                    
                                </>
                            : 
                                <>
                                    <div className='flex w-full h-full items-center justify-center bg-white relative'>
                                        {displayBgCover}

                                        <div className='z-[99999] w-3/4'>
                                            <button onClick={() => startApp('saved_tracks')} type="button" className="mx-auto flex group gap-2 items-center justify-center mt-6 text-black hover:text-spotify hover:bg-white bg-spotify font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                                                Continue with saved tracks
                                            </button>

                                            <div className="relative flex py-5 items-center w-full">
                                                <div className="flex-grow border-t border-primary-400"></div>
                                                <span className="flex-shrink mx-4 text-primary-400 font-powergrotesk">OR</span>
                                                <div className="flex-grow border-t border-primary-400"></div>
                                            </div>

                                            <div>
                                                <div className="flex">
                                                    <input type="search" id="search_playlist" className="rounded-none rounded-l-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5" placeholder="Full URl or Spotify ID" />
                                                    <button onClick={(e) => searchPlaylist()} className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200  rounded-r-lg">
                                                        <SearchOutline
                                                            color={'#000'}
                                                            height={'16px'}
                                                            width={'16px'}
                                                            className="cursor-pointer"
                                                        /> 
                                                    </button>
                                                </div>

                                                <div>
                                                    <div className='flex items-center'>
                                                        {appMode == 'playlist' && searchByUrl ? <>
                                                            <div className='flex w-full items-center justify-between pt-5'>
                                                                <div className='flex items-center gap-2'>
                                                                    <img className="w-10 h-10 p-1 rounded-lg" src={(searchByUrl && searchByUrl.images) ? searchByUrl.images[0].url : ''} alt="Spotify playlist cover" />
                                                                    <div>
                                                                        <p className=''>{searchByUrl.name} ({searchByUrl.tracks.total})</p>
                                                                        <p className='italic text-xs text-primary font-medium'>{searchByUrl.description}</p>
                                                                    </div>
                                                                </div>

                                                                <button type="button" className="" onClick={() => startApp('playlist')}>
                                                                    <ArrowForwardCircleOutline
                                                                        color={'#FFF'}
                                                                        height={'24px'}
                                                                        width={'24px'}
                                                                        className="cursor-pointer"
                                                                    /> 
                                                                </button>
                                                            </div>
                                                        </> : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                </div>
            </>
        )
    }
}


export async function getServerSideProps(context) {
    const session = await getSession(context)

    async function fetchWebApi(url, method, body) {
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
            },
            method,
            body:JSON.stringify(body)
        });
        return await res.json();
    }

    try {
        // Get the 50 last recent saved tracks
        async function getSpotifySavedTracks(url){
            return await fetchWebApi(url, 'GET');
        }
        const spotify_savedTracks = await getSpotifySavedTracks(`https://api.spotify.com/v1/me/tracks?offset=0&limit=${SPOTIFY_LIMIT}`);
        if(spotify_savedTracks.error){
            return {
                props : {
                    connected: false,
                }
            }
        }

        return {
            props : {
                pre_tracks : spotify_savedTracks.items.map(({ track }, index) => ({
                    position: index + 1,
                    id: track.id,
                    uri: track.uri,
                    name: track.name,
                    preview_url: track.preview_url,
                    artists: track.artists.map(artist => artist.name).join(', '),
                    cover: track.album.images[0].url,
                })),
                connected: true,
            }
        }
        
    } catch(error) {
        return {
            props : {
                connected: false,
            }
        }
    }  
}
