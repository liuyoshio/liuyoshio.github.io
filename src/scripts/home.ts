/**
 * Home page behaviour (src/pages/index.astro):
 * - entrance animation: commands type themselves, the name decodes, output fades in
 * - a pointer-following spotlight on the dot-grid background
 * - scramble-on-hover for post and project titles
 * - j/k to move between entries, / to focus the prompt
 * - a small interactive shell (help, ls, cat, open, cd, theme, ...)
 */

interface Entry {
	id: string;
	title: string;
	desc: string;
	url: string;
	date?: string;
	repo?: string;
}

interface TermData {
	name: string;
	github: string;
	now: string[];
	posts: Entry[];
	projects: Entry[];
}

/* ------------------------------------------------------------------ helpers */

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const GLYPHS = '!<>-_\\/[]{}—=+*^?#$%&@~01';
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

/** Decode `target` into `el` left to right, through random glyphs. Spaces stay put. */
function scramble(
	el: HTMLElement,
	target: string,
	duration = 600,
	aborted: () => boolean = () => false,
): Promise<void> {
	const running = (el as HTMLElement & { _scr?: number })._scr;
	if (running) cancelAnimationFrame(running);
	return new Promise((resolve) => {
		const start = performance.now();
		const len = target.length;
		const tick = (now: number) => {
			const progress = aborted() ? 1 : Math.min(1, (now - start) / duration);
			const settled = Math.floor(progress * len);
			let out = target.slice(0, settled);
			for (let i = settled; i < len; i++) out += target[i] === ' ' ? ' ' : randomGlyph();
			el.textContent = out;
			if (progress < 1) {
				(el as HTMLElement & { _scr?: number })._scr = requestAnimationFrame(tick);
			} else {
				el.textContent = target;
				(el as HTMLElement & { _scr?: number })._scr = 0;
				resolve();
			}
		};
		(el as HTMLElement & { _scr?: number })._scr = requestAnimationFrame(tick);
	});
}

/* ------------------------------------------------------------ entrance anim */

function initEntrance(home: HTMLElement, animate: boolean) {
	home.classList.add('ready');
	const all = home.querySelectorAll<HTMLElement>('[data-anim]');
	if (!animate) {
		for (const el of all) el.classList.add('shown');
		return;
	}

	const done = (el: HTMLElement) => el.dataset.done === '1';
	const finish = (el: HTMLElement) => {
		const typed = el.querySelector<HTMLElement>('.typed');
		if (typed?.dataset.text) typed.textContent = typed.dataset.text;
		const scr = el.querySelector<HTMLElement>('.scr');
		if (scr?.dataset.text) scr.textContent = scr.dataset.text;
		el.classList.remove('typing');
		el.classList.add('shown');
		el.dataset.done = '1';
	};

	// Remember the final text before anything is emptied.
	for (const el of all) {
		const typed = el.querySelector<HTMLElement>('.typed');
		if (typed) typed.dataset.text = typed.textContent ?? '';
		const scr = el.querySelector<HTMLElement>('.scr');
		if (scr) scr.dataset.text = scr.textContent ?? '';
	}

	async function run(el: HTMLElement) {
		if (done(el)) return;
		const kind = el.dataset.anim;
		if (kind === 'type') {
			const typed = el.querySelector<HTMLElement>('.typed');
			const text = typed?.dataset.text ?? '';
			if (!typed) return finish(el);
			typed.textContent = '';
			el.classList.add('shown', 'typing');
			await sleep(140);
			for (let i = 1; i <= text.length && !done(el); i++) {
				typed.textContent = text.slice(0, i);
				await sleep(38 + Math.random() * 46);
			}
			if (!done(el)) await sleep(180);
			finish(el);
		} else if (kind === 'scramble') {
			const scr = el.querySelector<HTMLElement>('.scr');
			el.classList.add('shown');
			if (scr) await scramble(scr, scr.dataset.text ?? '', 700, () => done(el));
			finish(el);
		} else {
			el.classList.add('shown');
			el.dataset.done = '1';
			await sleep(kind === 'row' ? 70 : 110);
		}
	}

	async function runGroup(group: Element) {
		for (const el of group.querySelectorAll<HTMLElement>('[data-anim]')) {
			if (!done(el)) await run(el);
		}
	}

	// Any key or click finishes the hero right away.
	const skip = (event: Event) => {
		if (event instanceof KeyboardEvent && ['Shift', 'Meta', 'Control', 'Alt'].includes(event.key)) return;
		for (const el of home.querySelectorAll<HTMLElement>('[data-seq="hero"] [data-anim]')) finish(el);
		window.removeEventListener('keydown', skip, true);
		window.removeEventListener('pointerdown', skip, true);
	};
	window.addEventListener('keydown', skip, true);
	window.addEventListener('pointerdown', skip, true);

	const hero = home.querySelector('[data-seq="hero"]');
	const others = [...home.querySelectorAll('[data-seq]')].filter((g) => g !== hero);
	const extras = [...home.querySelectorAll<HTMLElement>('[data-anim]')].filter((el) => !el.closest('[data-seq]'));

	const heroDone = hero ? runGroup(hero) : Promise.resolve();
	heroDone.then(() => {
		window.removeEventListener('keydown', skip, true);
		window.removeEventListener('pointerdown', skip, true);
		for (const el of extras) el.classList.add('shown');
	});

	// Later sections play when they scroll into view (after the hero, if both are visible).
	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				io.unobserve(entry.target);
				heroDone.then(() => runGroup(entry.target));
			}
		},
		{ rootMargin: '0px 0px -12% 0px' },
	);
	for (const group of others) io.observe(group);
}

/* ---------------------------------------------------------------- spotlight */

function initSpotlight() {
	const glow = document.querySelector<HTMLElement>('.grid-glow');
	if (!glow || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
	let frame = 0;
	let x = 0;
	let y = 0;
	window.addEventListener(
		'pointermove',
		(event) => {
			x = event.clientX;
			y = event.clientY;
			if (frame) return;
			frame = requestAnimationFrame(() => {
				glow.style.setProperty('--mx', `${x}px`);
				glow.style.setProperty('--my', `${y}px`);
				glow.classList.add('lit');
				frame = 0;
			});
		},
		{ passive: true },
	);
	document.documentElement.addEventListener('pointerleave', () => glow.classList.remove('lit'));
}

/* ----------------------------------------------------------- hover scramble */

function initHoverScramble(home: HTMLElement, reduceMotion: boolean) {
	if (reduceMotion) return;
	for (const link of home.querySelectorAll<HTMLAnchorElement>('[data-hover-scramble]')) {
		// Scramble a visual copy only, so the link's accessible name never changes.
		const text = (link.textContent ?? '').trim().replace(/\s+/g, ' ');
		link.textContent = '';
		const label = document.createElement('span');
		label.className = 'sr-only';
		label.textContent = text;
		const visual = document.createElement('span');
		visual.setAttribute('aria-hidden', 'true');
		visual.textContent = text;
		link.append(label, visual);

		const row = link.closest('.row') ?? link;
		let busy = false;
		const play = () => {
			if (busy) return;
			busy = true;
			scramble(visual, text, Math.min(520, 180 + text.length * 8)).then(() => (busy = false));
		};
		row.addEventListener('pointerenter', play);
		link.addEventListener('focus', play);
	}

	const name = home.querySelector<HTMLElement>('.name .scr');
	if (name) {
		name.closest('.name')?.addEventListener('pointerenter', () => {
			scramble(name, name.dataset.text || name.textContent || '', 520);
		});
	}
}

/* ------------------------------------------------------------------ mascot */

function initMascot(home: HTMLElement, reduceMotion: boolean) {
	const cat = home.querySelector<HTMLButtonElement>('.mascot');
	if (!cat) return;

	const hop = () => {
		if (reduceMotion) return;
		cat.classList.remove('hop');
		void cat.offsetWidth; // restart the animation
		cat.classList.add('hop');
	};
	cat.addEventListener('animationend', (event) => {
		if (event.animationName === 'mascot-hop') cat.classList.remove('hop');
	});

	cat.addEventListener('click', () => {
		hop();
		home.dispatchEvent(new CustomEvent('mascot:pet'));
	});
	home.addEventListener('mascot:hop', hop);

	if (reduceMotion) return;

	// Blink every few seconds, sometimes twice.
	const blink = () => {
		cat.classList.add('blink');
		setTimeout(() => cat.classList.remove('blink'), 130);
	};
	const scheduleBlink = () => {
		setTimeout(() => {
			blink();
			if (Math.random() < 0.3) setTimeout(blink, 260);
			scheduleBlink();
		}, 2200 + Math.random() * 3800);
	};
	scheduleBlink();

	// Eyes follow the pointer, one pixel in each direction.
	let frame = 0;
	window.addEventListener(
		'pointermove',
		(event) => {
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				const box = cat.getBoundingClientRect();
				const dx = event.clientX - (box.left + box.width / 2);
				const dy = event.clientY - (box.top + box.height / 2);
				const step = (d: number, dead: number) => (Math.abs(d) < dead ? 0 : Math.sign(d));
				cat.style.setProperty('--ex', `${step(dx, 40)}px`);
				cat.style.setProperty('--ey', `${step(dy, 60)}px`);
			});
		},
		{ passive: true },
	);
}

/* ------------------------------------------------------------------ window */

function initWindow(home: HTMLElement) {
	const win = home.querySelector<HTMLElement>('[data-window]');
	if (!win) return;
	const bar = win.querySelector<HTMLElement>('.titlebar');
	const body = win.querySelector<HTMLElement>('.window-body');

	const setCollapsed = (collapsed: boolean) => {
		win.classList.toggle('collapsed', collapsed);
		// Keep collapsed content out of the tab order and the accessibility tree.
		if (body) body.inert = collapsed;
	};
	const toggleZoom = () => win.classList.toggle('zoomed');

	for (const button of win.querySelectorAll<HTMLButtonElement>('[data-win]')) {
		button.addEventListener('click', (event) => {
			event.stopPropagation();
			if (button.dataset.win === 'zoom') toggleZoom();
			else setCollapsed(!win.classList.contains('collapsed'));
		});
	}
	bar?.addEventListener('click', () => {
		if (win.classList.contains('collapsed')) setCollapsed(false);
	});
	bar?.addEventListener('dblclick', (event) => {
		if ((event.target as HTMLElement).closest('.light')) return;
		if (!win.classList.contains('collapsed')) toggleZoom();
	});
}

/* ------------------------------------------------------------- keyboard nav */

function isTyping(target: EventTarget | null) {
	return (
		target instanceof HTMLElement &&
		(target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
	);
}

function initKeys(home: HTMLElement) {
	const input = home.querySelector<HTMLInputElement>('.prompt-input');
	window.addEventListener('keydown', (event) => {
		if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
		if (event.key === '/' && input) {
			event.preventDefault();
			const win = home.querySelector<HTMLElement>('[data-window].collapsed');
			if (win) win.querySelector<HTMLElement>('.titlebar')?.click();
			input.focus({ preventScroll: true });
			input.scrollIntoView({ block: 'center', behavior: 'smooth' });
			return;
		}
		if (event.key !== 'j' && event.key !== 'k') return;
		const items = [...home.querySelectorAll<HTMLAnchorElement>('.nav-item')];
		if (items.length === 0) return;
		event.preventDefault();
		const current = items.indexOf(document.activeElement as HTMLAnchorElement);
		const next =
			current === -1
				? event.key === 'j'
					? 0
					: items.length - 1
				: Math.max(0, Math.min(items.length - 1, current + (event.key === 'j' ? 1 : -1)));
		items[next].focus({ preventScroll: true });
		items[next].closest('.row')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	});
}

/* -------------------------------------------------------------------- clock */

function initClock(home: HTMLElement) {
	const clock = home.querySelector<HTMLElement>('[data-clock]');
	if (!clock) return;
	const update = () => {
		const now = new Date();
		clock.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
	};
	update();
	setInterval(update, 15_000);
}

/* -------------------------------------------------------------------- shell */

type Part = string | { text: string; href?: string; cls?: string; cmd?: string };
type Line = { parts: Part[]; cls?: string };

function initShell(home: HTMLElement, data: TermData) {
	const form = home.querySelector<HTMLFormElement>('.prompt');
	const input = home.querySelector<HTMLInputElement>('.prompt-input');
	const log = home.querySelector<HTMLOListElement>('.shell-log');
	const shell = home.querySelector<HTMLElement>('.shell');
	const status = home.querySelector<HTMLElement>('.statusline');
	const mode = status?.querySelector<HTMLElement>('.mode');
	if (!form || !input || !log || !shell) return;

	const history: string[] = [];
	let cursor = 0;
	const MAX_LINES = 80;

	const line = (...parts: Part[]): Line => ({ parts });
	const styled = (cls: string, ...parts: Part[]): Line => ({ parts, cls });
	const t = (text: string, cls?: string): Part => ({ text, cls });
	const link = (text: string, href: string, cls?: string): Part => ({ text, href, cls });
	const run = (text: string, cmd = text): Part => ({ text, cmd, cls: 'hl' });

	function print(lines: Line[]) {
		for (const { parts, cls } of lines) {
			const li = document.createElement('li');
			if (cls) li.className = cls;
			for (const part of parts) {
				if (typeof part === 'string') {
					li.append(part);
					continue;
				}
				let node: HTMLElement;
				if (part.href) {
					node = document.createElement('a');
					(node as HTMLAnchorElement).href = part.href;
				} else if (part.cmd) {
					node = document.createElement('a');
					(node as HTMLAnchorElement).href = '#';
					node.dataset.cmd = part.cmd;
				} else {
					node = document.createElement('span');
				}
				if (part.cls) node.className = part.cls;
				node.textContent = part.text;
				li.append(node);
			}
			log!.append(li);
		}
		while (log!.children.length > MAX_LINES) log!.firstElementChild?.remove();
	}

	const go = (url: string, label: string): Line[] => {
		setTimeout(() => {
			window.location.href = url;
		}, 380);
		return [line(t('→ ', 'ok'), `opening ${label}`, t(' …', 'dim'))];
	};

	const findPost = (arg: string) => {
		if (/^\d+$/.test(arg)) return data.posts[Number(arg) - 1];
		const q = arg.replace(/^posts\//, '').replace(/\/$/, '').toLowerCase();
		return data.posts.find((p) => p.id === q) ?? data.posts.find((p) => p.id.startsWith(q));
	};
	const findProject = (arg: string) => {
		const q = arg.replace(/^projects\//, '').replace(/\/$/, '').toLowerCase();
		return data.projects.find((p) => p.id === q) ?? data.projects.find((p) => p.id.startsWith(q));
	};

	const listPosts = (): Line[] =>
		data.posts.length === 0
			? [line(t('total 0', 'dim'))]
			: data.posts.map((p, i) =>
					line(t(`${String(i + 1).padStart(2)}  `, 'num'), t(`${p.date}  `, 'dim'), run(p.title, `open ${i + 1}`)),
				);
	const listProjects = (): Line[] =>
		data.projects.map((p) => line(t('drwxr-xr-x  ', 'dim'), run(`${p.id}/`, `cat projects/${p.id}`)));

	const isDark = () => {
		const root = document.documentElement;
		return (root.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
	};

	const commands: Record<string, { help: string; run: (args: string[]) => Line[] | 'clear' }> = {
		help: {
			help: 'list commands',
			run: () => [
				line(t('available commands:', 'dim')),
				...Object.entries(commands)
					.filter(([name]) => !HIDDEN.has(name))
					.map(([name, c]) => line('  ', run(name.padEnd(9)), t(c.help, 'dim'))),
				line(t('tab completes, ↑/↓ walks history. click any highlighted text to run it.', 'dim')),
			],
		},
		ls: {
			help: 'list files — ls posts, ls projects',
			run: ([dir]) => {
				const d = (dir ?? '').replace(/\/$/, '');
				if (!d || d === '.' || d === '~') return [line(run('posts/', 'ls posts'), '   ', run('projects/', 'ls projects'), '   ', run('now.txt', 'cat now.txt'))];
				if (d === 'posts' || d === 'blog') return listPosts();
				if (d === 'projects') return listProjects();
				return [styled('err', `ls: ${dir}: No such file or directory`)];
			},
		},
		cat: {
			help: 'print a file — cat now.txt, cat posts/<name>',
			run: ([file]) => {
				if (!file) return [styled('err', 'cat: missing file operand')];
				if (file === 'now.txt') return data.now.map((s) => line(s));
				const project = file.startsWith('projects/') ? findProject(file) : undefined;
				if (project) {
					return [
						line(t(project.title, 'hl')),
						line(project.desc),
						line(t('→ ', 'ok'), run(`open ${project.id}`), ...(project.repo ? ['  ', link('[code]', project.repo)] : [])),
					];
				}
				const post = findPost(file) ?? findProject(file);
				if (!post) return [styled('err', `cat: ${file}: No such file or directory`)];
				return [line(t(post.title, 'hl')), line(post.desc), line(t('→ ', 'ok'), run(`open ${post.id}`))];
			},
		},
		open: {
			help: 'open a post or project — open 1, open lookma',
			run: ([arg]) => {
				if (!arg) return [styled('err', 'open: which one? try ', run('ls posts'))];
				if (arg === 'github') return go(data.github, 'github');
				if (arg === 'rss') return go('/rss.xml', 'rss.xml');
				const target = findPost(arg) ?? findProject(arg);
				return target ? go(target.url, target.title) : [styled('err', `open: ${arg}: not found`)];
			},
		},
		cd: {
			help: 'go somewhere — cd blog, cd projects, cd tags',
			run: ([dir = '~']) => {
				const d = dir.replace(/^\.?\//, '').replace(/\/$/, '');
				if (d === '~' || d === '' || d === '.') return [line(t("you're already home.", 'dim'))];
				if (d === 'blog' || d === 'posts') return go('/blog/', '/blog/');
				if (d === 'projects') return go('/projects/', '/projects/');
				if (d === 'tags') return go('/tags/', '/tags/');
				if (d === '..') return [line(t('nothing above ~ but the void.', 'dim'))];
				return [styled('err', `cd: no such file or directory: ${dir}`)];
			},
		},
		whoami: { help: 'who is this', run: () => [line(t(data.name, 'hl'), t(' — builds things, breaks them, writes it down.', 'dim'))] },
		github: { help: 'open my GitHub', run: () => go(data.github, 'github.com/liuyoshio') },
		rss: { help: 'subscribe via RSS', run: () => go('/rss.xml', 'rss.xml') },
		theme: {
			help: 'switch theme — theme, theme light, theme dark',
			run: ([want]) => {
				const button = document.querySelector<HTMLButtonElement>('.theme-toggle');
				if (want && want !== 'light' && want !== 'dark') return [styled('err', `theme: unknown theme: ${want}`)];
				const target = want ?? (isDark() ? 'light' : 'dark');
				if ((target === 'dark') !== isDark()) button?.click();
				return [line(t('✓ ', 'ok'), `theme set to ${target}`)];
			},
		},
		history: {
			help: 'show command history',
			run: () =>
				history.length === 0
					? [line(t('(empty)', 'dim'))]
					: history.map((h, i) => line(t(`${String(i + 1).padStart(4)}  `, 'num'), run(h))),
		},
		date: { help: 'print the date', run: () => [line(new Date().toString())] },
		echo: { help: 'print text', run: (args) => [line(args.join(' '))] },
		clear: { help: 'clear the screen', run: () => 'clear' },
		pet: {
			help: 'pet the cat',
			run: () => {
				home.dispatchEvent(new CustomEvent('mascot:hop'));
				return [purr()];
			},
		},
		// Hidden extras.
		sudo: { help: '', run: () => [styled('err', `${data.name.split(' ')[0].toLowerCase()} is not in the sudoers file. This incident will be reported.`)] },
		exit: { help: '', run: () => [line(t('there is no exit. there is only ', 'dim'), run('cd blog'), t('.', 'dim'))] },
		pwd: { help: '', run: () => [line('/home/jiawei')] },
		uname: { help: '', run: () => [line('JiaweiOS 1.0 — astro, mono fonts, too much caffeine')] },
		rm: { help: '', run: () => [styled('err', 'rm: permission denied. nice try.')] },
		vim: { help: '', run: () => [line(t('you are already in it. ', 'dim'), t(':q', 'hl'), t(' will not help.', 'dim'))] },
	};
	const PURRS = ['=^.^=  purr…', 'mrrp?', '=^ω^=  meow!', '*headbutts your cursor*', 'the cat approves of this blog.', '*slow blink*'];
	let purrs = 0;
	function purr(): Line {
		return line(t(PURRS[purrs++ % PURRS.length], 'ok'));
	}
	home.addEventListener('mascot:pet', () => {
		print([styled('echo', t('jiawei', 'ps1'), t('@liu', 'ps1'), t(':~', 'path'), t('$ ', 'sig'), 'pet'), purr()]);
		form.scrollIntoView({ block: 'nearest' });
	});

	const HIDDEN = new Set(['sudo', 'exit', 'pwd', 'uname', 'rm', 'vim']);
	commands.man = { help: '', run: commands.help.run };
	commands.ll = { help: '', run: commands.ls.run };
	HIDDEN.add('man').add('ll');

	const proc = home.querySelector<HTMLElement>('[data-win-proc]');
	let procTimer = 0;
	function showProc(name: string) {
		if (!proc) return;
		proc.textContent = name.slice(0, 16);
		clearTimeout(procTimer);
		procTimer = window.setTimeout(() => (proc.textContent = 'zsh'), 1400);
	}

	function execute(raw: string) {
		const text = raw.trim();
		print([
			{
				parts: [
					t('jiawei', 'ps1'),
					t('@liu', 'ps1'),
					t(':~', 'path'),
					t('$ ', 'sig'),
					text,
				],
				cls: 'echo',
			},
		]);
		if (!text) return;
		history.push(text);
		cursor = history.length;
		const [name, ...args] = text.split(/\s+/);
		showProc(name);
		const command = commands[name.toLowerCase()];
		if (!command) {
			print([styled('err', `command not found: ${name}. `, t('try ', 'dim'), run('help'))]);
			return;
		}
		const out = command.run(args);
		if (out === 'clear') {
			log!.replaceChildren();
			return;
		}
		print(out);
	}

	/* Completion: commands for the first word, then files/targets per command. */
	function candidates(value: string): string[] {
		const parts = value.split(/\s+/);
		if (parts.length <= 1) {
			return Object.keys(commands)
				.filter((c) => !HIDDEN.has(c))
				.filter((c) => c.startsWith(parts[0]));
		}
		const [cmd, arg = ''] = parts;
		const postFiles = data.posts.map((p) => `posts/${p.id}`);
		const projectFiles = data.projects.map((p) => `projects/${p.id}`);
		const pool: Record<string, string[]> = {
			ls: ['posts/', 'projects/'],
			cat: ['now.txt', ...postFiles, ...projectFiles],
			open: [...data.posts.map((p) => p.id), ...data.projects.map((p) => p.id), 'github', 'rss'],
			cd: ['blog/', 'projects/', 'tags/'],
			theme: ['light', 'dark'],
		};
		return (pool[cmd] ?? []).filter((c) => c.startsWith(arg));
	}

	function complete() {
		const value = input!.value;
		const options = candidates(value.trimStart());
		if (options.length === 0) return;
		const parts = value.trimStart().split(/\s+/);
		const prefix = parts.length <= 1 ? '' : `${parts[0]} `;
		if (options.length === 1) {
			input!.value = prefix + options[0] + (parts.length <= 1 ? ' ' : '');
		} else {
			// Extend to the longest common prefix, and show the options.
			let common = options[0];
			for (const o of options) while (!o.startsWith(common)) common = common.slice(0, -1);
			input!.value = prefix + common;
			print([styled('dim', options.join('   '))]);
		}
		sync();
	}

	const sync = () => form.classList.toggle('has-value', input.value.length > 0);

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		execute(input.value);
		input.value = '';
		sync();
		form.scrollIntoView({ block: 'nearest' });
	});

	input.addEventListener('input', sync);
	input.addEventListener('keydown', (event) => {
		if (event.key === 'Tab' && input.value.trim()) {
			event.preventDefault();
			complete();
		} else if (event.key === 'ArrowUp' && history.length) {
			event.preventDefault();
			cursor = Math.max(0, cursor - 1);
			input.value = history[cursor] ?? '';
			sync();
		} else if (event.key === 'ArrowDown' && history.length) {
			event.preventDefault();
			cursor = Math.min(history.length, cursor + 1);
			input.value = history[cursor] ?? '';
			sync();
		} else if (event.key === 'l' && event.ctrlKey) {
			event.preventDefault();
			log.replaceChildren();
		} else if (event.key === 'Escape') {
			input.blur();
		}
	});

	input.addEventListener('focus', () => {
		status?.classList.add('insert');
		if (mode) mode.textContent = 'INSERT';
	});
	input.addEventListener('blur', () => {
		status?.classList.remove('insert');
		if (mode) mode.textContent = 'NORMAL';
	});

	// Clicking the prompt area focuses the input; clicking a highlighted word runs it.
	shell.addEventListener('click', (event) => {
		const target = event.target as HTMLElement;
		const runnable = target.closest<HTMLElement>('[data-cmd]');
		if (runnable) {
			event.preventDefault();
			execute(runnable.dataset.cmd ?? '');
			input.focus({ preventScroll: true });
			return;
		}
		if (target.closest('a')) return;
		if (window.getSelection()?.toString()) return;
		input.focus({ preventScroll: true });
	});
}

/* --------------------------------------------------------------------- boot */

const home = document.getElementById('home');
const dataEl = document.getElementById('term-data');

if (home && dataEl) {
	const data = JSON.parse(dataEl.textContent || '{}') as TermData;
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const animate = home.classList.contains('anim');

	initEntrance(home, animate);
	if (!reduceMotion) initSpotlight();
	initHoverScramble(home, reduceMotion);
	initWindow(home);
	initMascot(home, reduceMotion);
	initShell(home, data);
	initKeys(home);
	initClock(home);
}
