CXX = clang++
CXXFLAGS = -std=c++17 -O3 -Wall
LDFLAGS = -lpcap

all: sensor_core

sensor_core: sensor_core.cpp
	$(CXX) $(CXXFLAGS) -o sensor_core sensor_core.cpp $(LDFLAGS)

clean:
	rm -f sensor_core
