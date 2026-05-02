#include <iostream>
#include <pcap.h>
#include <netinet/in.h>
#include <netinet/if_ether.h>

using namespace std;

void packet_handler(u_char *user, const struct pcap_pkthdr *pkthdr, const u_char *packet) {
    struct ether_header *eth_header = (struct ether_header *) packet;
    if (ntohs(eth_header->ether_type) != ETHERTYPE_IP) return;

    cout << "Packet captured! Length: " << pkthdr->len << " bytes" << endl;
}

int main(int argc, char *argv[]) {
    char *dev;
    char errbuf[PCAP_ERRBUF_SIZE];
    pcap_t *handle;

    if (argc > 1) {
        dev = argv[1];
    } else {
        dev = pcap_lookupdev(errbuf);
        if (dev == NULL) {
            cerr << "Couldn't find default device: " << errbuf << endl;
            return 2;
        }
    }

    handle = pcap_open_live(dev, BUFSIZ, 1, 1000, errbuf);
    if (handle == NULL) {
        cerr << "Couldn't open device " << dev << ": " << errbuf << endl;
        return 2;
    }

    cout << "[*] C++ Core Initialized. Listening on " << dev << "..." << endl;
    pcap_loop(handle, 0, packet_handler, NULL);

    pcap_close(handle);
    return 0;
}