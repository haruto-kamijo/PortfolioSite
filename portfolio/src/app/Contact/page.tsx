import Header from '@/app/(Components)/Header';
import Footer from '@/app/(Components)/Footer';
import FV from "@/app/(Components)/FV";

export default function Page() {
	return (
		<div className="flex h-screen p-0 double-gradation">
			<Header title="Kamijo Haruto"></Header>
			<h1 className="absolute top-20 left-4 text-xl">Comming soon...</h1>
			<Footer/>
		</div>
	);
}
