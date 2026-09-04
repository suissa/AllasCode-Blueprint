ZIG ?= zig

.PHONY: all wasm serve clean

all: wasm

wasm:
	cd wasm && $(ZIG) build-exe kernel.zig \
		-target wasm32-freestanding \
		-O ReleaseFast \
		-fno-entry \
		--export=kernel \
		--export=identity \
		--export=linear_memory_bytes

serve:
	python3 -m http.server 8080

clean:
	rm -f wasm/kernel.wasm wasm/kernel.wasm.o
