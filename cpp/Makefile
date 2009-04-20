CC=g++ -g

test: dhcp123.o bitbuffer.o test.c
	g++ dhcp123.o bitbuffer.o test.c -o test

dhcp123.o: dhcp123.h bitbuffer.h dhcp123.cpp
	g++ -c dhcp123.cpp 

bitbuffer.o: bitbuffer.h bitbuffer.cpp
	g++ -c bitbuffer.cpp

clean: 
	rm test *.o
