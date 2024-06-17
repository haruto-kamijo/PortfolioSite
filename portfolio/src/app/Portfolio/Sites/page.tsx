import Header from '@/app/(Components)/Header';
import Footer from '@/app/(Components)/Footer';


export default function Page() {
	return (
		<div className="flex h-screen p-0 bg-sky-100 seven-gradation">
			<Header title="Portfolio Site"></Header>
			<div className="flex overflow-x-auto h-5/6 absolute top-12 mt-3">
			</div>
			<Footer/>
		</div>
	);
}
