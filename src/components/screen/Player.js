/* eslint-disable @next/next/no-img-element */
import React from 'react'
import dynamic from "next/dynamic"
import { RefreshOutline, CloseOutline, FlameOutline, HeartOutline, PlayCircleOutline, PauseCircleOutline } from 'react-ionicons'
import { toast } from 'react-toastify';
import useKeypress from 'react-use-keypress';

import { selectSession } from "../../store/authSlice"
import { 
    selectIsStarted, 
    selectAppMode,
    setIsPlaying, selectIsPlaying, 
    setIsFinish, selectIsFinish,
    selectTracksList, setTracksList, 
    selectSelectedTracks, setSelectedTracks, addSelectedTracksItem, addSelectedTracksItemAtFirst,
    selectPassedTracks, setPassedTracks, addPassedTracksItem,
    selectCurrentPage, setCurrentPage,
    selectSearchResultUsed,
    selectCurrentIndex, setCurrentIndex,
    selectNumberOfPage, 
    selectTotal} from "../../store/appSlice"

import { useDispatch, useSelector } from "react-redux"

import fetchWebApi from '../../controller/fetchWebApi'

const TinderCard = dynamic(() => import('../../libs/react-tinder-card.js'), {
    ssr: false
});

const SPOTIFY_LIMIT = 50;

const PlayerScreen = () => {

	/**
	 * Redux State
	 */
	const session = useSelector(selectSession)
	const appMode = useSelector(selectAppMode)
	const isStarted = useSelector(selectIsStarted)
	const isFinish = useSelector(selectIsFinish)
	const isPlaying = useSelector(selectIsPlaying)
	const currentPage = useSelector(selectCurrentPage)
	const currentIndex = useSelector(selectCurrentIndex)
	const numberOfPage = useSelector(selectNumberOfPage)
	const total = useSelector(selectTotal)
	const trackslist = useSelector(selectTracksList)
	const selectedTracks = useSelector(selectSelectedTracks)
	const passedTracks = useSelector(selectPassedTracks)
    const searchResultUsed = useSelector(selectSearchResultUsed)
	const dispatch = useDispatch()


    /**
     * Toggle preview music
     */
    const togglePreview = () => {
        const track = trackslist[(currentIndex) ? currentIndex : 0];

        if(isPlaying){
            document.getElementById('preview-music').pause();
            dispatch(setIsPlaying(false));
        }else{
            playMusic(track)
        }
    }
    
    /**
     * Try to play a music
     */
    const playMusic = (track) => {
        if(track && track.preview_url){
            document.getElementById('preview-music').setAttribute('src', track.preview_url);
            document.getElementById('preview-music').play();
            // document.getElementById('preview-music').volume = 0.05;
            dispatch(setIsPlaying(true));
        }else{
            if(track && !track.preview_url){
                document.getElementById('preview-music').pause();
                dispatch(setIsPlaying(false));

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

    /**
     * Swipe a music
     */
    const handleSwiped = async (direction, index, mode = '') => {
        const track = trackslist[index];
        const next_track = trackslist[index + 1];

        // On met à jour l'index pour la musique suivante
        updateCurrentIndex((track) ? track.position : currentIndex)

        if((track) && !passedTracks.includes(track.uri)){
            dispatch(addPassedTracksItem( track.uri ))

            // If liked
            if(direction == "right"){
                if(!selectedTracks.find((el) => el.id == track.id)){
                    if(mode == 'superlike'){
                        dispatch(addSelectedTracksItemAtFirst(track))
                    }else{
                        dispatch(addSelectedTracksItem( track ))
                    }
                }
            }
        }

        // Pas de suite -> On check le load more
        if(!next_track){
            await loadMore();
        }
        
        // On joue la prochaine musique
        playMusic(next_track)
    }

    /**
     * Load more tracks
     */
    const loadMore = async () => {
        if(appMode == 'saved_tracks'){
            const finded_playlist = await fetchWebApi(
                `v1/me/tracks?market=FR&limit=${SPOTIFY_LIMIT}&offset=${SPOTIFY_LIMIT * currentPage}`, 
                'GET', 
                session.accessToken
            );
    
            if(finded_playlist.error){
                console.log('error on load more');
            }else{
                if(finded_playlist.items && finded_playlist.items.length == 0){
                    dispatch(setIsPlaying(false));
                    dispatch(setIsFinish(true));
                    document.getElementById('preview-music').pause();
                }else{
                    let __trackslist = finded_playlist.items.map(({ track }, index) => ({
                        position: (index + 1) + (SPOTIFY_LIMIT * currentPage),
                        id: track.id,
                        uri: track.uri,
                        name: track.name,
                        preview_url: track.preview_url,
                        artists: track.artists.map(artist => artist.name).join(', '),
                        cover: track.album.images[0].url,
                    }));
                    
                    dispatch(setTracksList([...trackslist, ...__trackslist]))
        
                    // Play preview
                    const track = [...trackslist, ...__trackslist][SPOTIFY_LIMIT * currentPage];
        
                    if((track)){
                        playMusic(track);
                    }
        
                    dispatch(setIsPlaying(true));
                    dispatch(setCurrentPage(currentPage + 1));
                }
            }
        }

        else if(appMode == 'playlist'){
            const finded_playlist = await fetchWebApi(
                `v1/playlists/${searchResultUsed}/tracks?offset=${(50 * currentPage - 1) + 1}&limit=50`, 
                'GET', 
                session.accessToken
            );

            if(finded_playlist.error){
                console.log('error on load more');
            }else{
                if(finded_playlist.items && finded_playlist.items.length == 0){
                    dispatch(setIsPlaying(false));
                    dispatch(setIsFinish(true));
                    document.getElementById('preview-music').pause();
                }else{
                    let __trackslist = finded_playlist.items.map(({ track }, index) => ({
                        position: (index + 1) + ((currentPage == 2 ? 100 : 50 * currentPage)),
                        id: track.id,
                        uri: track.uri,
                        name: track.name,
                        preview_url: track.preview_url,
                        artists: track.artists.map(artist => artist.name).join(', '),
                        cover: track.album.images[0].url,
                    }));

                    dispatch(setTracksList([...trackslist, ...__trackslist]))
        
                    // Play preview
                    const track = [...trackslist, ...__trackslist][((currentPage == 2 ? 100 : 50 * currentPage))];
        
                    if((track)){
                        playMusic(track);
                    }

                    dispatch(setIsPlaying(true));
                    dispatch(setCurrentPage(currentPage + 1));
                }
                
            }
        }
    }

    /**
     * Reverse last action
     */
    const goBack = async (pos) => {
        const track = trackslist[pos];
        const prev_track = trackslist[pos - 1];

        if(track && pos !== 0){

            if (document.getElementById(`trackcard-${pos}`)){
                document.getElementById(`trackcard-${pos}`).style.transform = ''
                document.getElementById(`trackcard-${pos}`).style.transform = 'translate3d(0px, 0px, 0px) rotate(0deg);'
                document.getElementById(`trackcard-${pos}`).style.transition = 'all 0.2s ease-out'
            }

            // On met à jour l'index
            dispatch(setCurrentIndex(pos - 1))
            
            // On joue la musique précédente
            playMusic(prev_track)
        }

        if(prev_track && prev_track.preview_url){
            const __passed_tracks = passedTracks.filter(function(el) { return el != prev_track.uri; }); 
            dispatch(setPassedTracks(__passed_tracks))

            const __selected_tracks = selectedTracks.filter(function(el) { return el.uri != prev_track.uri; }); 
            dispatch(setSelectedTracks(__selected_tracks))
        }
    }

    /**
     * Handle Swipe
     */
    const swipe = async (dir, pos) => {
        const y = Math.floor(Math.random() * (600 - -600 + 1)) + -600;

        if(dir == 'left'){
            if (document.getElementById(`trackcard-${pos}`)){
                document.getElementById(`trackcard-${pos}`).style.transition = 'all 0.5s ease-out'
                document.getElementById(`trackcard-${pos}`).style.transform = `translate3d(-1572.43px, ${y}px, 0px) rotate(-44.9424deg)`
            }
            handleSwiped('left', pos - 1)
        }
        if(dir == 'right'){
            if (document.getElementById(`trackcard-${pos}`)){
                document.getElementById(`trackcard-${pos}`).style.transition = 'all 0.5s ease-out'
                document.getElementById(`trackcard-${pos}`).style.transform = `translate3d(1469.28px, ${y}px, 0px) rotate(41.9943deg)`
            }
            handleSwiped('right', pos - 1)
        }
    }

    /**
     * SuperLike will add the music at the top of playlist
     */
    const superLike = async (pos) => {
        if (document.getElementById(`trackcard-${pos}`)){
            document.getElementById(`trackcard-${pos}`).style.transition = 'all 0.5s ease-out'
            document.getElementById(`trackcard-${pos}`).style.transform = 'translate3d(1432.57px, -653.162px, 0px) rotate(40.945deg)'
        }
        handleSwiped('right', pos - 1, 'superlike')
    }


    /**
     * Handle KeyPress
     */
    useKeypress([' ', 'p', 'k', 'b', 'd', 'l', 's', 'ArrowRight', 'ArrowLeft'], (event) => {
        if(isStarted && event.target.tagName.toUpperCase() !== 'INPUT'){
            if (event.key === ' ' && !isFinish) {
                togglePreview()
            } else if (event.key === 'p') {
                console.log('P');
            } else if (event.key === 'k') {
                console.log('k');
            } else if (event.key === 'b' && !isFinish) {
                goBack(currentIndex)
            } else if (event.key === 'd' || event.key === 'ArrowLeft' && !isFinish) {
                swipe('left', currentIndex + 1)
            } else if (event.key === 'l' || event.key === 'ArrowRight' && !isFinish) {
                swipe('right', currentIndex + 1)
            } else if (event.key === 's' && !isFinish) {
                superLike(currentIndex + 1)
            }
        }
    });

    /**
     * Update the current index
     */
    const updateCurrentIndex = (val) => {
        dispatch(setCurrentIndex(val))
    }



	/**
	 * Render the App screen
	 */
	return (
        <>
            <div className={`${!isStarted ? 'hidden' : '' } z-[99994]`}>
                <div className='absolute w-full h-full flex-col gap-4 flex items-center justify-center'>
                    {
                        currentPage < numberOfPage && !isFinish ? <>
                            <div role="status">
                                <svg aria-hidden="true" className="w-8 h-8 mr-2 animate-spin text-primary-700 fill-primary-700" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                                </svg>
                                <span className="sr-only font-powergrotesk">Loading...</span>
                            </div>
                        </> : <p className='text-primary-700 font-powergrotesk'> You&apos;ve reached the end</p>
                    }

                    <div className={`${(isFinish ? '' : 'hidden')} z-[99994]`}>
                        <button data-modal-target="searchplaylistModal" data-modal-toggle="searchplaylistModal" className="underline decoration-primary font-powergrotesk" type="button">
                            Search a playlist
                        </button>
                    </div>
                </div>

                {trackslist ? 
                    trackslist.map((item, index) => (
                        <TinderCard 
                            className={`swipe absolute m-auto left-0 right-0 w-full h-full trackcard`}
                            key={index}
                            onSwipe={(dir) => handleSwiped(dir, index)}
                            zindex={total - index}
                            total={total}
                            preventSwipe={["up", "down"]}
                            swipeRequirementType="position"
                            swipeThreshold={100}
                            id={`trackcard-${item.position}`}
                        >
                            <div data-name={item.name} className={`w-full h-full relative overflow-hidden bg-cover bg-center`} style={{ backgroundImage: `url(${item.cover})` }}>
                                <div className="absolute bottom-0 w-full flex justify-between px-6 pb-6 pt-28 gradientback bg-white">
                                    <div className="w-full">
                                        <div className='flex justify-between items-center w-full mb-4'>
                                            <div>
                                                <button className="pressable p-2 border rounded-full border-[#F8C449] hover:bg-[rgba(248,196,73,0.2)]" onClick={() => goBack(item.position - 1)}>
                                                    <RefreshOutline
                                                        color={'#F8C449'}
                                                        height={'22px'}
                                                        width={'22px'}
                                                    />
                                                </button>
                                            </div>
                                            <div className='flex gap-4 items-center'>
                                                <button className="pressable p-3 border rounded-full border-[#FD3075] hover:bg-[rgba(253,48,116,0.2)]" onClick={() => swipe('left', item.position)}>
                                                    <CloseOutline
                                                        color={'#FD3075'}
                                                        height={'22px'}
                                                        width={'22px'}
                                                    />
                                                </button>
                                                <button className="pressable p-2 border rounded-full border-[#39B0FB] hover:bg-[rgba(57,177,251,0.2)]" onClick={() => superLike(item.position)}>
                                                    <FlameOutline
                                                        color={'#39B0FB'}
                                                        height={'22px'}
                                                        width={'22px'}
                                                    />
                                                </button>
                                                <button className="pressable p-3 border rounded-full border-[#1AE6A9] hover:bg-[rgba(26,230,169,0.2)]" onClick={() => swipe('right', item.position)}>
                                                    <HeartOutline
                                                        color={'#1AE6A9'}
                                                        height={'22px'}
                                                        width={'22px'}
                                                    />
                                                </button>
                                            </div>
                                            <div className='w-10'></div>
                                        </div>
                                        <span className="block font-semibold text-primary-600 text-3xl font-powergrotesk truncate">{item.name}</span>
                                        <span className="block italic text-lg font-medium font-powergrotesk truncate">{item.artists}</span>
                                    </div>
                                </div>
                            </div>
                        </TinderCard>
                    ))
                :
                    <>No music</>
                }

                {/* Play button */}
                {( SPOTIFY_LIMIT * currentPage !== currentIndex && !isFinish) ? 
                    <div className='absolute z-[99995] w-100 w-full bottom-0'>
                        <div className='flex justify-between px-6 pb-6 mt-4'>
                            <div></div>
                            <button className="pressable p-0" onClick={() => togglePreview()}>
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
            </div>
        </>
	)
}

export default PlayerScreen
