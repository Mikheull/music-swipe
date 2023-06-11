import React, { useEffect } from 'react'
import { signOut } from "next-auth/react"
import Image from 'next/image';

import { Dropdown } from 'flowbite-react';
import { MusicalNoteOutline, TrashOutline } from 'react-ionicons'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-toastify';

import { selectSession } from "../store/authSlice"
import { selectIsStarted, selectSelectedTracks, setSelectedTracks, removeSelectedTracksItem, selectNameOfPlaylist, setNameOfPlaylist, setUseSavedSession, selectUseSavedSession } from "../store/appSlice"
import { 
    selectSessionSaved, setSessionSaved, 
    selectSavedNameOfPlaylist, setSavedNameOfPlaylist } from "../store/sessionSlice"

import { useDispatch, useSelector } from "react-redux"


const Navbar = () => {

	/**
	 * Redux State
	 */
	const session = useSelector(selectSession)
	const use_saved_session = useSelector(selectUseSavedSession)
	const isStarted = useSelector(selectIsStarted)
	const selectedTracks = useSelector(selectSelectedTracks)
	const nameOfPlaylist = useSelector(selectNameOfPlaylist)

	const sessionSaved = useSelector(selectSessionSaved)
	const saved_nameOfPlaylist = useSelector(selectSavedNameOfPlaylist)

	const dispatch = useDispatch()


	/**
	 * Reorder Functions
	 */
	const onDragEnd = async (result) => {
        if (!result.destination) {
          	return;
        }
    
        const items = reorder(
            selectedTracks,
          	result.source.index,
          	result.destination.index
        );
		dispatch(setSelectedTracks(items))
    }
	const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        return result;
    };


	/**
	 * Playlist rename
	 */
	const setPlaylistName = async (val) => {
		dispatch(setNameOfPlaylist(val))
		dispatch(setSavedNameOfPlaylist(val))
	}

	/**
	 * Playlist creation
	 */
	const createPlaylist = async () => {
		async function createPrivatePlaylist(tracksUri){
			const playlist = await fetchWebApi(
				`v1/users/${session.accountId}/playlists`, 'POST', {
				"name": nameOfPlaylist,
				"description": "Playlist created with music-swipe",
				"public": false
			})
			
			await fetchWebApi(
				`v1/playlists/${playlist.id}/tracks?uris=${tracksUri.join(',')}`,
				'POST'
			);
			
			return playlist;
		}
		const createdPlaylist = await createPrivatePlaylist(selectedTracks.map( e => e.uri ));

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
	
	/**
	 * Render the navbar
	 */
	return (
		<div className='absolute z-[99999] w-100 w-full'>
			<div className='flex justify-between px-6 pb-6 mt-4'>
				<div className='pressable'>
					<Dropdown
						inline
						label={
							<Image
								src={(session && session.user && session.user.image) ? session.user.image : ''}
								width={40}
								height={40}
								className='p-1 rounded-full ring-2 ring-primary-700'
								alt="Spotify avatar"
							/>
						}
					>
						<Dropdown.Header>
							<span className="block text-sm">
								Hello <span className='text-primary-700'>{(session && session.user && session.user.name) ? session.user.name : 'stranger'}</span>
							</span>
						</Dropdown.Header>
						
						<Dropdown.Item className='text-black' onClick={() => window.location.reload(false)}>
							Reload
						</Dropdown.Item>
						
						{sessionSaved ? 
							<Dropdown.Item className='text-black' onClick={() => dispatch(setSessionSaved(false)) && dispatch(setUseSavedSession(false)) && window.location.reload(false)}>
								Clear session
							</Dropdown.Item>
						: ''}
						
						<Dropdown.Item className='text-black'>
							<button data-modal-target="shortcutsModal" data-modal-toggle="shortcutsModal" className="" type="button">
								Shortcuts
							</button>
						</Dropdown.Item>
						
						<Dropdown.Item onClick={() => signOut()} className='text-red-600'>
							Sign out
						</Dropdown.Item>
					</Dropdown>
				</div>
				<div>
					<div className={`${(isStarted ? '' : 'hidden')} relative`}>
						<button data-modal-target="playlistModal" data-modal-toggle="playlistModal" className="pressable flex items-center bg-primary-600 rounded-full p-2" type="button">
							<MusicalNoteOutline
								color={'#FFF'}
								height={'32px'}
								width={'32px'}
							/> 
						</button>
						<span className={`${(selectedTracks.length > 0 ? '' : 'hidden')} absolute bottom-0 left-8 transform font-bold flex items-center justify-center translate-y-1/4 w-5 h-5 bg-white rounded-full text-xs text-primary-700`}>{(selectedTracks.length !== 0) ?selectedTracks.length : ''}</span>
					</div>

					{/* Modal */}
					<div id="playlistModal" tabIndex="-1" className="fixed z-[99999] top-0 left-0 right-0 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
						<div className="relative w-full max-w-2xl max-h-full">
							<div className="relative bg-white rounded-lg shadow">
								<div className="flex items-center justify-between p-5 border-b rounded-t">
									<h3 className="text-xl font-medium text-gray-900 font-powergrotesk">
										Create your playlist
									</h3>
									<button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" data-modal-hide="playlistModal">
										<svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
										<span className="sr-only">Close modal</span>
									</button>
								</div>
								<div className="p-6 space-y-6">
									<div className='bg-[#1E073B] overflow-scroll px-5 md:px-10 py-5 rounded-lg h-[55vh]'>
										<h2 className='text-lg font-bold font-powergrotesk'>{nameOfPlaylist}</h2>
										<p className='text-sm text-primary font-powergrotesk'>Playlist created with music-swipe</p>

										<div className='mt-5 flex flex-col gap-2'>
											{
												(selectedTracks.length == 0) ? 
													<span className='italic text-xs text-gray-400 font-powergrotesk'>It&apos;s too quiet I don&apos;t like it much</span>
												:
												<DragDropContext onDragEnd={onDragEnd} >
													<Droppable droppableId="droppable">
													{(provided, snapshot) => (
														<div
														{...provided.droppableProps}
														ref={provided.innerRef}
														>
														{selectedTracks.map((item, index) => (
															<Draggable key={item.id} draggableId={item.id} index={index}>
															{(provided, snapshot) => (
																<div
																className='flex items-center justify-between mb-2'
																ref={provided.innerRef}
																{...provided.draggableProps}
																{...provided.dragHandleProps}
																>
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
																			onClick={() => dispatch(removeSelectedTracksItem(index))}
																		/> 
																	</div>
																</div>
															)}
															</Draggable>
														))}
														{provided.placeholder}
														</div>
													)}
													</Droppable>
												</DragDropContext>
											}
										</div>
									</div>
								</div>
								<div className="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b">
									<input onChange={(e) => setPlaylistName(e.target.value)} type="text" className={`${(selectedTracks.length > 0 ? '' : 'hidden')} bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5`} placeholder="My playlist name"/>
									<button data-modal-hide="playlistModal" onClick={() => createPlaylist()} type="button" className={`${(selectedTracks.length > 0 ? '' : 'hidden')} text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center`}>Create</button>
									<button data-modal-hide="playlistModal" type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10">Cancel</button>
								</div>
							</div>
						</div>
					</div>

					{/* Shortcuts Modal */}
					<div id="shortcutsModal" tabIndex="-1" className="fixed z-[99999] top-0 left-0 right-0 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
						<div className="relative w-full max-w-2xl max-h-full">
							<div className="relative bg-white rounded-lg shadow">
								<div className="flex items-center justify-between p-5 border-b rounded-t">
									<div>
										<h3 className="text-xl font-medium text-gray-900 font-powergrotesk">
											Keyboard shortcuts
										</h3>
										<p className='text-sm text-primary font-powergrotesk mt'>Hyper speeeeed</p>
									</div>
									<button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center" data-modal-hide="shortcutsModal">
										<svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
										<span className="sr-only">Close modal</span>
									</button>
								</div>
								<div className="p-6 space-y-6">
									<div className='overflow-scroll rounded-lg h-[55vh]'>
										<div className="relative overflow-x-auto">
											<table className="w-full text-sm text-left text-gray-500">
												<thead className="text-xs text-gray-700 uppercase bg-gray-100">
													<tr>
														<th scope="col" className="px-6 py-3">
															Key
														</th>
														<th scope="col" className="px-6 py-3">
															Description
														</th>
													</tr>
												</thead>
												<tbody>
													<tr className="bg-white border-b">
														<th scope="row" className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap flex items-center">
															<kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg ">L</kbd>
															<span className="mx-2">or</span>
															<kbd className="inline-flex items-center px-2 py-1.5 text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
																<svg className="w-4 h-4" aria-hidden="true" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512"><path d="M118.6 105.4l128 127.1C252.9 239.6 256 247.8 256 255.1s-3.125 16.38-9.375 22.63l-128 127.1c-9.156 9.156-22.91 11.9-34.88 6.943S64 396.9 64 383.1V128c0-12.94 7.781-24.62 19.75-29.58S109.5 96.23 118.6 105.4z"/></svg>
																<span className="sr-only">Arrow key right</span>
															</kbd>
														</th>
														<td className="px-6 py-4">
															Like a song
														</td>
													</tr>
													<tr className="bg-white border-b">
														<th scope="row" className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap flex items-center">
															<kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg ">D</kbd>
															<span className="mx-2">or</span>
															<kbd className="inline-flex items-center px-2 py-1.5 text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
															<svg className="w-4 h-4" aria-hidden="true" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512"><path d="M137.4 406.6l-128-127.1C3.125 272.4 0 264.2 0 255.1s3.125-16.38 9.375-22.63l128-127.1c9.156-9.156 22.91-11.9 34.88-6.943S192 115.1 192 128v255.1c0 12.94-7.781 24.62-19.75 29.58S146.5 415.8 137.4 406.6z"/></svg>
																<span className="sr-only">Arrow key left</span>
															</kbd>
														</th>
														<td className="px-6 py-4">
															Dislike a song
														</td>
													</tr>
													<tr className="bg-white border-b">
														<th scope="row" className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap">
															<kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg ">S</kbd>
														</th>
														<td className="px-6 py-4">
															SuperLike a song (will be added at the top of the list)
														</td>
													</tr>
													<tr className="bg-white border-b">
														<th scope="row" className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap">
															<kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg ">B</kbd>
														</th>
														<td className="px-6 py-4">
															Cancels the last swap
														</td>
													</tr>
													<tr className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
														<th scope="row" className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap dark:text-gray-400">
															<kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Space</kbd>
														</th>
														<td className="px-6 py-4">
															Play or Pause the preview
														</td>
													</tr>
													<tr className="bg-white border-b">
														<th scope="row" className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap">
															<kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg ">P</kbd>
														</th>
														<td className="px-6 py-4">
															Open the playlist modal
														</td>
													</tr>
													<tr className="bg-white border-b">
														<th scope="row" className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap">
															<kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg ">H</kbd>
														</th>
														<td className="px-6 py-4">
															Open this modal
														</td>
													</tr>
												</tbody>
											</table>

										</div>
									</div>
								</div>
								<div className="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b">
									<button data-modal-hide="shortcutsModal" type="button" className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10">Close</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Navbar
