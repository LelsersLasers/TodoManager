<script>
	import {
		listenerMainCollection,
		createMainCollection,
		updateMainCollection,
		deleteMainCollection,
		shareMainCollection,
		leaveMainCollection,
        removeShareMainCollection,
		signInWithGoogle,
		signOutWithGoogle,
		currentUserStore
	} from '$lib/firebase/firebase';
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';

	import Modal from '$lib/components/Modal.svelte';

    let userEmail = '';

	let showSignoutModal = false;

	let showCreateListModal = false;

	let showEditListModal = false;
	let editingListId = '';
	let editingListName = '';

	let showDeleteListModal = false;
	let deletingListConfirmation = false;

	let showShareListModal = false;
	let sharingListId = '';
	let sharingEmail = '';
	let shareMessage = 'Email address';

	let showLeaveListModal = false;
	let showLeavingListConfirmation = false;

    let showRemoveListModal = false;
    let removingEmail = '';
    let showRemovingListConfirmation = false;

	let showWithListModal = false;
	let emails = [];

	let currentUserLoading = true;
	let snapshotLoading = true;

	let lists = [];

	let unsubFromLists = () => {};
	let unsubFromUser = () => {};

	async function updateLoginStatus(u) {
		unsubFromLists();
		if (u) {
            userEmail = u.email;
			unsubFromLists = await listenerMainCollection((arr) => {
				lists = arr;
				if (snapshotLoading) snapshotLoading = false;
			});
		} else {
			lists = [];
			unsubFromLists = () => {};
			snapshotLoading = true;
		}
		// Better solution??
		// Stops the sign in from quickly flashing on the screen
		if (currentUserLoading) {
			setTimeout(() => {
				currentUserLoading = false;
			}, 200);
		}
	}

	onMount(() => {
		unsubFromUser = currentUserStore.subscribe(updateLoginStatus);
	});
	onDestroy(() => {
		unsubFromLists();
		unsubFromUser();
	});

	let createListText = '';
	function createList() {
		createListText = createListText.trim();
		if (createListText.length === 0) return;

		createMainCollection(createListText);
		createListText = '';
		showCreateListModal = false;
	}

	function startEditingList(id, name) {
		editingListId = id;
		editingListName = name;
		showEditListModal = true;

        deletingListConfirmation = false;
	}
	function editList() {
		updateMainCollection(editingListId, editingListName);

		editingListId = '';
		editingListName = '';
		showEditListModal = false;

		deletingListConfirmation = false;
	}

	function startDeletingList() {
        deletingListConfirmation = false;
		showDeleteListModal = true;
	}
	function deleteList() {
		deleteMainCollection(editingListId);

		editingListId = '';
		editingListName = '';
		showEditListModal = false;

		deletingListConfirmation = false;
		showDeleteListModal = false;
	}

	function startSharingList(id) {
		sharingListId = id;
		sharingEmail = '';
		showShareListModal = true;
		shareMessage = 'Email address';

		showLeavingListConfirmation = false;
	}
	function shareList() {
		sharingEmail = sharingEmail.trim();
		if (sharingEmail.length === 0) return;

		shareMainCollection(sharingListId, sharingEmail)
			.then(() => {
				shareMessage = `Shared list with ${sharingEmail}`;
			})
			.catch((err) => {
				shareMessage = `${err.data.message}`;
			})
			.finally(() => {
				sharingEmail = '';
			});
	}

	function startLeavingList() {
		showLeaveListModal = true;
	}
	function leaveList() {
		leaveMainCollection(sharingListId);

		sharingListId = '';
		sharingEmail = '';
		showShareListModal = false;

		showLeavingListConfirmation = false;
		showLeaveListModal = false;
        showWithListModal = false;
	}

    function startRemovingList(email) {
        removingEmail = email;
        showRemoveListModal = true;
    }
    async function removeList() {
        await removeShareMainCollection(sharingListId, removingEmail);

        removingEmail = '';
        updateEmails();

        showRemoveListModal = false;
    }

    function updateEmails() {
        emails = lists.find((list) => list.id === sharingListId).uids;

        // sort userEmail to the top
        const index = emails.indexOf(userEmail);
        if (index > -1) {
            emails.splice(index, 1);
            emails.unshift(userEmail);
        }
    }

	function startShowingWithList() {
        updateEmails();

        showRemovingListConfirmation = false;
		showWithListModal = true;
	}

	function signIn() {
		signInWithGoogle();
		showSignoutModal = false;
	}

	function redirectToList(id) {
		goto(`/list/${id}`);
	}
</script>

<header class="zeroBottomPadding">
	<hgroup>
		{#if $currentUserStore != null}
			<img
				class="floatRight"
				src={$currentUserStore.photoURL}
				alt="?"
				title="Signed in as {$currentUserStore.displayName}. Click to sign out."
				on:click={() => (showSignoutModal = true)}
				on:keydown={() => (showSignoutModal = true)}
				style="cursor: pointer;"
			/>
		{:else}
			<img
				class="floatRight"
				src="https://static.thenounproject.com/png/711255-200.png"
				alt=""
				title="Not signed in. Click to sign in with Google."
				on:click={signIn}
				on:keydown={signIn}
				style="cursor: pointer;"
			/>
		{/if}
		<h1>Todo Manager<sup>+</sup></h1>
		<h2>Managing your todos has never been this easy</h2>
	</hgroup>
</header>

<hr />

<main>
	{#if currentUserLoading}
		<h5>Loading</h5>
		<article class="zeroTopMargin" aria-busy="true" />
	{:else if $currentUserStore == null}
		<article class="zeroTopMargin">
			<h2 style="text-align: center;">Sign in to get started!</h2>
			<p style="text-align: center;">
				<kbd on:click={signIn} on:keydown={signIn} style="cursor: pointer;">Sign in</kbd
				> with your Google account to start managing your todos!
			</p>
		</article>

		<div class="stickyFooter zeroBottomMargin textAlignCenter">
			<button
				class="footerWidth zeroBottomMargin marginZeroAuto nintyFiveWidth"
				on:click={signIn}
			>
				Sign in with Google
			</button>
		</div>
	{:else if snapshotLoading}
		<h5>Loading</h5>
		<article class="zeroTopMargin" aria-busy="true" />
	{:else}
		{#if lists.length > 0}
			<h4 class="zeroBottomMargin">Todo lists:</h4>
			<table class="threeEmBottomMargin">
				<thead>
					<tr>
						<th><strong>Name</strong></th>
						<th class="zeroWidth zeroWidthPadding"><strong>#</strong></th>
						<th />
						<th />
					</tr>
				</thead>
				<tbody>
					{#each lists as list (list.id)}
						<tr
							on:click={redirectToList(list.id)}
							on:keydown={redirectToList(list.id)}
							style="cursor: pointer;"
						>
							<td class="breakWord">{list.name}</td>
							<td class="zeroWidth zeroWidthPadding">{list.count}</td>
							<td class="zeroWidth zeroWidthPadding">
								<kbd
									on:click|stopPropagation={startEditingList(list.id, list.name)}
									on:keydown|stopPropagation={startEditingList(list.id, list.name)}
									style="cursor: pointer;">Edit</kbd
								>
							</td>
							<td class="zeroWidth zeroWidthPadding">
								<kbd
									on:click|stopPropagation={startSharingList(list.id)}
									on:keydown|stopPropagation={startSharingList(list.id)}
									style="cursor: pointer;">Share</kbd
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<article class="zeroTopMargin">
				<h2>No todo lists yet!</h2>
				<p>
					Click the
					<kbd
						on:click={() => (showCreateListModal = true)}
						on:keydown={() => (showCreateListModal = true)}
						style="cursor: pointer;">Create</kbd
					>
					button to get started!
				</p>
			</article>
		{/if}

		<div class="stickyFooter zeroBottomMargin textAlignCenter">
			<button
				class="footerWidth zeroBottomMargin marginZeroAuto nintyFiveWidth"
				on:click={() => (showCreateListModal = true)}
			>
				Create new list
			</button>
		</div>

		<Modal bind:showModal={showCreateListModal}>
			<article class="zeroBottomPadding smallArticleTopPadding">
				<form method="POST" on:submit|preventDefault={createList}>
					<h1 class="zeroBottomMargin">
						<label for="createList">Create list</label>
					</h1>
					<input
						type="text"
						id="createList"
						name="createList"
						placeholder="List name"
						required
						autocomplete="off"
                        spellcheck="true"
						bind:value={createListText}
					/>
					<!-- floatRight just makes it float to get the margins/padding correct -->
					<input class="floatRight" type="submit" value="Create" />
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showEditListModal}>
			<article class="zeroBottomPadding smallArticleTopPadding">
				<form method="POST" on:submit|preventDefault={editList}>
					<h1 class="zeroBottomMargin"><label for="editList">Update list</label></h1>
					<input
						type="text"
						id="editList"
						name="editList"
						placeholder="List name"
						required
						autocomplete="off"
                        spellcheck="true"
						bind:value={editingListName}
					/>
					<input class="eightyWidth floatLeft" type="submit" value="Update" />
					<input
						class="fifteenWidth floatRight zeroPadding"
						type="reset"
						value="&#128465;"
						on:click|preventDefault={startDeletingList}
					/>
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showDeleteListModal}>
			<article class="zeroBottomPadding smallArticleTopPadding">
				<form method="POST" on:submit|preventDefault|stopPropagation={deleteList}>
					<h1 class="zeroBottomMargin">
						<label for="deleteList">Delete list</label>
					</h1>
					<label for="deleteList">
						Deleting a list will also delete it for all users who have access to it. Are
						you sure you want to delete this list?
						<input
							type="checkbox"
							role="switch"
							id="deleteList"
							name="deleteList"
							bind:checked={deletingListConfirmation}
						/>
					</label>
					<input
						class="floatRight"
						type="submit"
						value="Delete"
						disabled={!deletingListConfirmation}
					/>
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showShareListModal}>
			<article class="zeroBottomPadding smallArticleTopPadding">
				<form method="POST" on:submit|preventDefault={shareList}>
					<h1 class="zeroBottomMargin"><label for="shareList">Share list</label></h1>
					<input
						type="text"
						id="shareList"
						name="shareList"
						placeholder={shareMessage}
						required
						autocomplete="on"
						bind:value={sharingEmail}
					/>

					<input class="halfEmBottomMargin" type="submit" value="Share" />
					<input
						class="fiftyWidthWithSpace floatLeft zeroPadding"
						type="reset"
						value="Shared with"
						on:click|preventDefault={startShowingWithList}
					/>
					<input
						class="fiftyWidthWithSpace floatRight zeroPadding"
						type="reset"
						value="Leave"
						on:click|preventDefault={startLeavingList}
					/>
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showLeaveListModal}>
			<article class="zeroBottomPadding smallArticleTopPadding">
				<form method="POST" on:submit|preventDefault|stopPropagation={leaveList}>
					<h1 class="zeroBottomMargin">
						<label for="leaveList">Leave list</label>
					</h1>

					<label for="leaveList">
						Leaving a list will mean you will no longer be able to access it. Are you
						sure you want to leave this list?
						<input
							type="checkbox"
							role="switch"
							id="leaveList"
							name="leaveList"
							bind:checked={showLeavingListConfirmation}
						/>
					</label>

					<input
						class="floatRight"
						type="submit"
						value="Leave"
						disabled={!showLeavingListConfirmation}
					/>
				</form>
			</article>
		</Modal>

        <Modal bind:showModal={showRemoveListModal}>
			<article class="zeroBottomPadding smallArticleTopPadding">
				<form method="POST" on:submit|preventDefault|stopPropagation={removeList}>
					<h1 class="zeroBottomMargin">
						<label for="removeList">Remove user</label>
					</h1>

					<label for="removeList">
						Removing someone from a list will mean they will no longer be able to access it. Are you
                        sure you want to remove this user from the list?
						<input
							type="checkbox"
							role="switch"
							id="removeList"
							name="removeList"
							bind:checked={showRemovingListConfirmation}
						/>
					</label>

					<input
						class="floatRight"
						type="submit"
						value="Remove"
						disabled={!showRemovingListConfirmation}
					/>
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showWithListModal}>
			<article class="overflowScroll">
				<h1 class="zeroBottomMargin">Shared with</h1>

                <table>
                    <thead>
                        <tr>
                            <th><strong>Email</strong></th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {#each emails as email (email)}
                            <tr>
                                <td class="modifiedTd breakWord">{email}</td>
                                <td class="modifiedTd zeroWidth zeroWidthPadding">
                                    {#if email == userEmail}
                                        <kbd
                                            class="floatRight"
                                            on:click|stopPropagation={startLeavingList}
                                            on:keydown|stopPropagation={startLeavingList}
                                            style="cursor: pointer;">Leave</kbd
                                        >
                                    {:else}
                                        <kbd
                                            class="floatRight"
                                            on:click|stopPropagation={startRemovingList(email)}
                                            on:keydown|stopPropagation={startRemovingList(email)}
                                            style="cursor: pointer;">Remove</kbd
                                        >
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
			</article>
		</Modal>

		<Modal bind:showModal={showSignoutModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault={signOutWithGoogle}>
					<h1 class="zeroBottomMargin">Sign out?</h1>
					<p>Currently signed in as {$currentUserStore.displayName}</p>
					<br />

					<input type="submit" value="Sign out" />
				</form>
			</article>
		</Modal>
	{/if}
</main>
