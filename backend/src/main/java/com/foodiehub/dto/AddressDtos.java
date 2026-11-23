package com.foodiehub.dto;

import com.foodiehub.entity.Address;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public final class AddressDtos {

    private AddressDtos() {}

    public record AddressDto(
            Long id,
            String label,
            String fullName,
            String phone,
            String houseBuilding,
            String street,
            String city,
            String state,
            String pincode,
            String instructions,
            BigDecimal latitude,
            BigDecimal longitude,
            boolean isDefault
    ) {
        public static AddressDto from(Address a) {
            return new AddressDto(a.getId(), a.getLabel(), a.getFullName(), a.getPhone(),
                    a.getHouseBuilding(), a.getStreet(), a.getCity(), a.getState(), a.getPincode(),
                    a.getInstructions(), a.getLatitude(), a.getLongitude(), a.isDefaultAddress());
        }
    }

    public record AddressRequest(
            @Size(max = 30) String label,
            @NotBlank(message = "Full name is required") String fullName,
            @NotBlank(message = "Phone is required")
            @Pattern(regexp = "^[6-9]\\d{9}$|^[0-9]{10,15}$", message = "Enter a valid phone number")
            String phone,
            @NotBlank(message = "House/building is required") String houseBuilding,
            @NotBlank(message = "Street is required") String street,
            @NotBlank(message = "City is required") String city,
            @NotBlank(message = "State is required") String state,
            @NotBlank(message = "PIN code is required")
            @Pattern(regexp = "^\\d{6}$", message = "PIN code must be 6 digits")
            String pincode,
            String instructions,
            BigDecimal latitude,
            BigDecimal longitude,
            Boolean isDefault
    ) {}
}
