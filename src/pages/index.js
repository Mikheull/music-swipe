import { Dropdown } from 'flowbite-react';
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { getSession, useSession, signIn, signOut } from "next-auth/react"
import dynamic from "next/dynamic"
import { PlayCircleOutline, PauseCircleOutline, MusicalNoteOutline, TrashOutline, AlbumsOutline, SearchOutline, ArrowForwardCircleOutline } from 'react-ionicons'
import { toast } from 'react-toastify';

const TinderCard = dynamic(() => import('../libs/react-tinder-card.js'), {
  ssr: false
});
const SPOTIFY_LIMIT = 50;

export default function Home({connected, total, tracks, provider}) {
    const [numberOfPages, setNumberOfPages] = useState(0);
    const [playlistTracks, setPlaylistTracks] = useState([]);
    const [passedTracks, setPassedTracks] = useState([]);
    const [allTracks, setAllTracks] = useState((tracks) ? tracks : []);

    const [searchedId, setSearchedId] = useState(null);
    const [searchByUrl, setSearchByUrl] = useState(null);
    const [loadedPlaylistId, setLoadedPlaylistId] = useState(null);
    const [numberOfPagesPlaylist, setNumberOfPagesPlaylist] = useState(0);
    const [allTracksPlaylist, setAllTracksPlaylist] = useState([]);
    const [totalPlaylist, setTotalPlaylist] = useState(0);

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
            ((appMode == 'saved_tracks') ? total : totalPlaylist) ? 
                Array((appMode == 'saved_tracks') ? total : totalPlaylist)
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

        const track = (mode == 'saved_tracks') ? allTracks[0] : allTracksPlaylist[0];
        if((track)){
            if(track && track.preview_url){
                document.getElementById('preview-music').setAttribute('src', track.preview_url);
                document.getElementById('preview-music').play();
                // document.getElementById('preview-music').volume = 0.05;
            }
        }
    }

    // Load more music
    const loadMore = async () => {
        if(appMode == 'saved_tracks'){
            async function getSavedTracks(){
                if(provider == 'spotify'){
                    return (await fetchWebApi(
                        `v1/me/tracks?market=FR&limit=${SPOTIFY_LIMIT}&offset=${SPOTIFY_LIMIT * currentPage}`, 'GET'
                        ));
                }
                return []; 
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
                if(provider == 'spotify'){
                    return (await fetchWebApi(
                        `v1/playlists/${loadedPlaylistId}/tracks?offset=${(50 * currentPage - 1) + 1}&limit=50`, 'GET'
                        ));
                }
                return []; 
            }
        
            const savedTracks = await getPlaylistSavedTracks();
    
            if(savedTracks.error){
                console.log('error on load more');
            }else{
                if(savedTracks.items && savedTracks.items.length == 0){
                    setIsPlaying(false);
                    setIsFinish(true);
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
            
                    setAllTracksPlaylist([...allTracksPlaylist, ..._savedTracks])
        
                    // Play preview
                    const track = [...allTracksPlaylist, ..._savedTracks][((currentPage == 2 ? 100 : 50 * currentPage))];
        
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
        const track = (appMode == 'saved_tracks') ? allTracks[(currentIndex) ? currentIndex : 0] : allTracksPlaylist[(currentIndex) ? currentIndex : 0];
        
        if(isPlaying){
            document.getElementById('preview-music').pause();
            setIsPlaying(false);
        }else{
            if(track.preview_url){
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
        const track = (appMode == 'saved_tracks') ? allTracks[index] : allTracksPlaylist[index];
        const next_track = (appMode == 'saved_tracks') ? allTracks[index + 1] : allTracksPlaylist[index + 1];

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

    // Create the playlist
    const createPlaylist = async () => {
        async function createPrivatePlaylist(tracksUri){
            if(provider == 'spotify'){
                const playlist = await fetchWebApi(
                    `v1/users/${session.accountId}/playlists`, 'POST', {
                    "name": playlistName,
                    "description": "Playlist created with music-swipe",
                    "public": false
                })
                
                await fetchWebApi(
                    `v1/playlists/${playlist.id}/tracks?uris=${tracksUri.join(',')}`,
                    'POST'
                );
                
                return playlist;
            }

            return false
        }
        const createdPlaylist = await createPrivatePlaylist(playlistTracks.map( e => e.uri ));
        console.log(createdPlaylist);
        if(createdPlaylist.error){
            toast.error('There was a problem creating your playlist', {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: "colored",
            });
        }else{
            toast.success('Your playlist has been created', {
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
    
    useEffect(() => {
        setNumberOfPages((allTracks && total) ? Math.ceil(total / SPOTIFY_LIMIT) : 0);
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
        if(allTracks && allTracks.length > 1){
            const covers = shuffleArr(allTracks.map((track, index) => ({
                cover: track.cover,
            })));
            // const covers = allTracks.map((track, index) => ({
            //     cover: track.cover,
            // }));

            return (
                <>
                    <div className='bg-gradient-to-b from-[#1E073B] to-primary-900 w-full h-full absolute z-0 '>
                        <div>
                            <div className={`m-auto left-0 right-0 absolute -top-[4rem] flex justify-center gap-24`}>
                                <div data-cover-position="1" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[0].cover) ? covers[0].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="2" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[1].cover) ? covers[1].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        
                            <div className={`m-auto -left-[2rem] top-[4rem] absolute flex justify-center gap-24`}>
                                <div data-cover-position="3" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[2].cover) ? covers[2].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="4" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[3].cover) ? covers[3].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="5" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[4].cover) ? covers[4].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        </div>

                        <div>
                            <div className={`m-auto left-0 right-0 absolute top-[12rem] flex justify-center gap-24`}>
                                <div data-cover-position="6" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[5].cover) ? covers[5].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="7" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[6].cover) ? covers[6].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        
                            <div className={`m-auto -left-[2rem] top-[20rem] absolute flex justify-center gap-24`}>
                                <div data-cover-position="8" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[7].cover) ? covers[7].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="9" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[8].cover) ? covers[8].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="10" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[9].cover) ? covers[9].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        </div>

                        <div>
                            <div className={`m-auto left-0 right-0 absolute top-[28rem] flex justify-center gap-24`}>
                                <div data-cover-position="11" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[10].cover) ? covers[10].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="12" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[11].cover) ? covers[11].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                            </div>
                        
                            <div className={`m-auto -left-[2rem] top-[36rem] absolute flex justify-center gap-24`}>
                                <div data-cover-position="13" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[12].cover) ? covers[12].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="14" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[13].cover) ? covers[13].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
                                <div data-cover-position="15" className='opacity-50 bg-cover bg-center h-32 w-32 rounded-full' style={{ backgroundImage: `url(${(covers[14].cover) ? covers[14].cover : covers[Math.floor(Math.random()*covers.length)].cover})`}}></div>
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
                let _allTracks = founded_playlist.tracks.items.map(({ track }, index) => ({
                    position: (index + 1),
                    id: track.id,
                    uri: track.uri,
                    name: track.name,
                    preview_url: track.preview_url,
                    artists: track.artists.map(artist => artist.name).join(', '),
                    cover: track.album.images[0].url,
                }));

                setLoadedPlaylistId(processedUrl)
                setAllTracksPlaylist([...allTracksPlaylist, ..._allTracks])
                setNumberOfPagesPlaylist((founded_playlist && founded_playlist.tracks.total) ? Math.ceil(founded_playlist.tracks.total / 50) : 0);
                setCurrentPage(2)
                setTotalPlaylist(founded_playlist.tracks.total)
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
        return (
          <>
            <div className='absolute w-screen h-[calc(100dvh)] bg-primary-900'>
                <div className="mx-auto max-w-lg bg-[#1E073B] h-full">
                    <div className='relative w-full h-[calc(100dvh)] overflow-hidden flex flex-col gap-2 items-center justify-center'>

                        <h1 className='text-center block font-semibold text-white text-5xl font-powergrotesk leading-snug'>Create your ideal<br/> playlist</h1>
                        <button onClick={() => signIn('spotify')} type="button" className="flex group gap-2 items-center justify-center mt-6 text-spotify hover:text-white border border-spotify hover:bg-spotify font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                            <svg className='fill-spotify group-hover:fill-white' width="24" height="24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd"><path d="M19.098 10.638c-3.868-2.297-10.248-2.508-13.941-1.387-.593.18-1.22-.155-1.399-.748-.18-.593.154-1.22.748-1.4 4.239-1.287 11.285-1.038 15.738 1.605.533.317.708 1.005.392 1.538-.316.533-1.005.709-1.538.392zm-.126 3.403c-.272.44-.847.578-1.287.308-3.225-1.982-8.142-2.557-11.958-1.399-.494.15-1.017-.129-1.167-.623-.149-.495.13-1.016.624-1.167 4.358-1.322 9.776-.682 13.48 1.595.44.27.578.847.308 1.286zm-1.469 3.267c-.215.354-.676.465-1.028.249-2.818-1.722-6.365-2.111-10.542-1.157-.402.092-.803-.16-.895-.562-.092-.403.159-.804.562-.896 4.571-1.045 8.492-.595 11.655 1.338.353.215.464.676.248 1.028zm-5.503-17.308c-6.627 0-12 5.373-12 12 0 6.628 5.373 12 12 12 6.628 0 12-5.372 12-12 0-6.627-5.372-12-12-12z"/></svg>
                            Sign in with Spotify
                        </button>
                    </div>
                </div>
            </div>
          </>
        )

    // Si l'user est connecté
    }else{
        const list_tracks = (appMode == 'saved_tracks') ? allTracks : allTracksPlaylist
        return (
            <>
                {/* Audio part */}
                <audio id="preview-music" src="" preload="auto"></audio>
                {/* Tracks part*/}
                <div className="relative bg-yellow-400 h-[calc(100dvh)] w-screen inset-0 select-none" style={{ height: "-webkit-fill-available" }}>
                    <div className="mx-auto max-w-lg bg-[#1E073B] h-full">
                        <div className='relative w-full h-[calc(100dvh)] overflow-hidden'>
                            {/* Heading part  */}
                            <div className='absolute z-[99999] w-100 w-full'>
                                <div className='flex justify-between px-6 pb-6 mt-4'>
                                    <div>
                                        <Dropdown
                                            inline
                                            label={
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img className="w-10 h-10 p-1 rounded-full ring-2 ring-primary-700" src={(session && session.user && session.user.image) ? session.user.image : ''} alt="Spotify avatar" />
                                            }
                                        >
                                            <Dropdown.Header>
                                                <span className="block text-sm">
                                                    Hello <span className='text-primary-700'>{(session && session.user && session.user.name) ? session.user.name : 'stranger'}</span>
                                                </span>
                                            </Dropdown.Header>
                                            
                                            <Dropdown.Item onClick={() => signOut()} className='text-red-600'>
                                                Sign out
                                            </Dropdown.Item>
                                        </Dropdown>
                                    </div>
                                    <div>
                                        <div className={`${(started ? '' : 'hidden')} relative`}>
                                            <button data-modal-target="playlistModal" data-modal-toggle="playlistModal" className="flex items-center bg-primary-600 rounded-full p-2" type="button">
                                                <MusicalNoteOutline
                                                    color={'#FFF'}
                                                    height={'32px'}
                                                    width={'32px'}
                                                /> 
                                            </button>
                                            <span className={`${(playlistTracks.length > 0 ? '' : 'hidden')} absolute bottom-0 left-8 transform font-bold flex items-center justify-center translate-y-1/4 w-5 h-5 bg-white rounded-full text-xs text-primary-700`}>{(playlistTracks.length !== 0) ?playlistTracks.length : ''}</span>
                                        </div>

                                        {/* Modal */}
                                        <div id="playlistModal" tabIndex="-1" className="fixed z-[99999] top-0 left-0 right-0 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
                                            <div className="relative w-full max-w-2xl max-h-full">
                                                <div className="relative bg-white rounded-lg shadow">
                                                    <div className="flex items-center justify-between p-5 border-b rounded-t">
                                                        <h3 className="text-xl font-medium text-gray-900 font-powergrotesk">
                                                            Create your playlist from
                                                        </h3>
                                                        <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" data-modal-hide="playlistModal">
                                                            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                                            <span className="sr-only">Close modal</span>
                                                        </button>
                                                    </div>
                                                    <div className="p-6 space-y-6">
                                                        <div className='bg-[#1E073B] overflow-scroll px-5 md:px-10 py-5 rounded-lg h-[55vh]'>
                                                            <h2 className='text-lg font-bold font-powergrotesk'>{playlistName}</h2>
                                                            <p className='text-sm text-primary font-powergrotesk'>Playlist created with music-swipe</p>
            
                                                            <div className='mt-5'>
                                                                <ul className='flex flex-col gap-2'>
                                                                    {
                                                                        (playlistTracks.length == 0) ? 
                                                                            <span className='italic text-xs text-gray-400 font-powergrotesk'>It&apos;s too quiet I don&apos;t like it much</span>
                                                                        :
                                                                            playlistTracks.map((item, index) => (
                                                                                <li className='flex items-center justify-between' key={index + 1}>
                                                                                    <div className='flex items-center'>
                                                                                        <span className='text-sm text-primary mr-4 font-bold font-powergrotesk'>{index + 1}</span>
                                                                                        <div className=''>
                                                                                            <p className='font-powergrotesk'>{item.name}</p>
                                                                                            <p className='italic text-sm text-primary font-medium font-powergrotesk'>{item.artists}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <TrashOutline
                                                                                            color={'#FFF'}
                                                                                            height={'16px'}
                                                                                            width={'16px'}
                                                                                            className="cursor-pointer"
                                                                                            onClick={() => setPassedTracks(playlistTracks.splice(index, 1))}
                                                                                        /> 
                                                                                    </div>
                                                                                </li>
                                                                            ))
                                                                    }
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b">
                                                        <input onChange={(e) => setPlaylistName(e.target.value)} type="text" className={`${(playlistTracks.length > 0 ? '' : 'hidden')} bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5`} placeholder="My playlist name"/>
                                                        <button data-modal-hide="playlistModal" onClick={() => createPlaylist()} type="button" className={`${(playlistTracks.length > 0 ? '' : 'hidden')} text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center`}>Create</button>
                                                        <button data-modal-hide="playlistModal" type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10">Cancel</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
        
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
                                    </div>
        
                                    {list_tracks ? 
                                        list_tracks.map((item, index) => (
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
                                                    <input onChange={(e) => setSearchedId(e.target.value)} type="search" id="search_playlist" className="rounded-none rounded-l-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5" placeholder="Full URl or Spotify ID" />
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
                tracks : spotify_savedTracks.items.map(({ track }, index) => ({
                    position: index + 1,
                    id: track.id,
                    uri: track.uri,
                    name: track.name,
                    preview_url: track.preview_url,
                    artists: track.artists.map(artist => artist.name).join(', '),
                    cover: track.album.images[0].url,
                })),
                total: spotify_savedTracks.total,
                connected: true,
                provider: 'spotify'
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
