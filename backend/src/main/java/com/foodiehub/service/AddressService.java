package com.foodiehub.service;

import com.foodiehub.dto.AddressDtos.AddressDto;
import com.foodiehub.dto.AddressDtos.AddressRequest;
import com.foodiehub.entity.Address;
import com.foodiehub.entity.User;
import com.foodiehub.exception.ApiException;
import com.foodiehub.repository.AddressRepository;
import com.foodiehub.repository.UserRepository;
import com.foodiehub.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AddressDto> list() {
        return addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtAsc(SecurityUtils.currentUserId())
                .stream().map(AddressDto::from).toList();
    }

    @Transactional
    public AddressDto create(AddressRequest request) {
        Long userId = SecurityUtils.currentUserId();
        boolean isFirst = addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtAsc(userId).isEmpty();
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.unauthorized("User not found"));
        boolean makeDefault = Boolean.TRUE.equals(request.isDefault()) || isFirst;
        if (makeDefault) {
            clearDefault(userId);
        }
        Address address = map(new Address(), request, user);
        address.setDefaultAddress(makeDefault);
        return AddressDto.from(addressRepository.save(address));
    }

    @Transactional
    public AddressDto update(Long id, AddressRequest request) {
        Address address = requireOwn(id);
        boolean makeDefault = Boolean.TRUE.equals(request.isDefault());
        if (makeDefault && !address.isDefaultAddress()) {
            clearDefault(address.getUser().getId());
        }
        map(address, request, address.getUser());
        if (makeDefault) {
            address.setDefaultAddress(true);
        }
        return AddressDto.from(addressRepository.save(address));
    }

    @Transactional
    public void delete(Long id) {
        Address address = requireOwn(id);
        Long userId = address.getUser().getId();
        boolean wasDefault = address.isDefaultAddress();
        addressRepository.delete(address);
        if (wasDefault) {
            addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtAsc(userId).stream().findFirst()
                    .ifPresent(a -> {
                        a.setDefaultAddress(true);
                        addressRepository.save(a);
                    });
        }
    }

    @Transactional
    public AddressDto setDefault(Long id) {
        Address address = requireOwn(id);
        clearDefault(address.getUser().getId());
        address.setDefaultAddress(true);
        return AddressDto.from(addressRepository.save(address));
    }

    public Address requireOwn(Long id) {
        return addressRepository.findByIdAndUserId(id, SecurityUtils.currentUserId())
                .orElseThrow(() -> ApiException.notFound("Address not found"));
    }

    private void clearDefault(Long userId) {
        addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtAsc(userId).stream()
                .filter(Address::isDefaultAddress)
                .forEach(a -> {
                    a.setDefaultAddress(false);
                    addressRepository.save(a);
                });
    }

    private Address map(Address address, AddressRequest request, User user) {
        address.setUser(user);
        address.setLabel(request.label() == null || request.label().isBlank() ? "Home" : request.label());
        address.setFullName(request.fullName());
        address.setPhone(request.phone());
        address.setHouseBuilding(request.houseBuilding());
        address.setStreet(request.street());
        address.setCity(request.city());
        address.setState(request.state());
        address.setPincode(request.pincode());
        address.setInstructions(request.instructions());
        address.setLatitude(request.latitude());
        address.setLongitude(request.longitude());
        if (request.isDefault() != null && !request.isDefault()) {
            address.setDefaultAddress(false);
        }
        return address;
    }
}
