<script>
	import { page } from '$app/stores';

	import { goto } from '$app/navigation';

	function backToHome(id) {
		goto('/');
	}
</script>

<header class="zeroBottomPadding">
	<hgroup>
		<h1 class="fiveLeftMargin">{$page.status}</h1>
		<h2 class="fiveLeftMargin">{$page.error.message}</h2>
	</hgroup>
</header>

<hr />

<main>
	<button class="nintyWidth zeroAutoMargin" on:click={backToHome}>
		Return to dashboard
	</button>
</main>
