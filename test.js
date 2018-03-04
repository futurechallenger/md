let testObj = {
	des: 'hello world',
	foo: () => {
		console.log(`test obj 111 ${this.des}`)
	}
}

testObj.foo();


let content = 'hello desc';
let testObj2 = {
	content,
	foo: () => {
		console.log(`test obj 222 ${this.content}`)
	}
}

testObj2.foo();