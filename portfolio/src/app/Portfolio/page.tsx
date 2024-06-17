import Header from '@/app/(Components)/Header';
import Footer from '@/app/(Components)/Footer';
import FV from "@/app/(Components)/FV";

export default function Page() {
	return (
		<div className="flex h-screen p-0 double-gradation">
			<Header title="Kamijo Haruto"></Header>
			<div>
				<div className="main-contents"></div>
				<div className="icon-contents">
					<button>
						<svg className="h-16 w-16 text-purple-500 icon-scroll" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5"
								 stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
							<path stroke="none" d="M0 0h24v24H0z"/>
							<path d="M18 15l-6-6l-6 6h12" transform="rotate(270 12 12)"/>
						</svg>
					</button>
					<button className="icon-bg">
						<svg className="h-16 w-16 text-purple-500" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5"
								 stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
							<path stroke="none" d="M0 0h24v24H0z"/>
							<rect x="4" y="4" width="16" height="4" rx="1"/>
							<rect x="4" y="12" width="6" height="8" rx="1"/>
							<line x1="14" y1="12" x2="20" y2="12"/>
							<line x1="14" y1="16" x2="20" y2="16"/>
							<line x1="14" y1="20" x2="20" y2="20"/>
						</svg>
					</button>
					<button className="icon-bg">
						<svg className="h-16 w-16 text-purple-500" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5"
								 stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
							<path stroke="none" d="M0 0h24v24H0z"/>
							<rect x="2" y="6" width="20" height="12" rx="2"/>
							<path d="M6 12h4m-2 -2v4"/>
							<line x1="15" y1="11" x2="15" y2="11.01"/>
							<line x1="18" y1="13" x2="18" y2="13.01"/>
						</svg>
					</button>
					<button className="icon-bg">
						<svg className="h-16 w-16 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"
								 strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
							<path
								d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
							<polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
							<line x1="12" y1="22.08" x2="12" y2="12"/>
						</svg>
					</button>
					<button className="icon-bg">
						<svg className="h-16 w-16 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
						</svg>
					</button>
					<button className="icon-bg">
						<svg className="h-16 w-16 text-purple-500" viewBox="0 0 24 23" fill="none" stroke="currentColor"
								 strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
							<path
								d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
						</svg>
					</button>
					<button>
						<svg className="h-16 w-16 text-purple-500 icon-scroll" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5"
								 stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
							<path stroke="none" d="M0 0h24v24H0z"/>
							<path d="M18 15l-6-6l-6 6h12" transform="rotate(90 12 12)"/>
						</svg>
					</button>
				</div>
			</div>
			<Footer/>
		</div>
	);
}
