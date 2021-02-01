#! /usr/bin/env bash

IFS=" " read -ra uname <<< "$(uname -srm)"
kernel_name="${uname[0]}"
kernel_version="${uname[1]}"
kernel_machine="${uname[2]}"

if [[ "$kernel_name" == "Darwin" ]]; then
    IFS=$'\n' read -d "" -ra sw_vers <<< "$(awk -F'<|>' '/key|string/ {print $3}' \
                        "/System/Library/CoreServices/SystemVersion.plist")"
    for ((i=0;i<${#sw_vers[@]};i+=2)) {
        case ${sw_vers[i]} in
            ProductName)          darwin_name=${sw_vers[i+1]} ;;
            ProductVersion)       osx_version=${sw_vers[i+1]} ;;
            ProductBuildVersion)  osx_build=${sw_vers[i+1]}   ;;
        esac
    }
fi

case $kernel_name in
    Darwin)   os=$darwin_name ;;
    SunOS)    os=Solaris ;;
    Haiku)    os=Haiku ;;
    MINIX)    os=MINIX ;;
    AIX)      os=AIX ;;
    IRIX*)    os=IRIX ;;
    FreeMiNT) os=FreeMiNT ;;

    Linux|GNU*)
        os=Linux
    ;;

    *BSD|DragonFly|Bitrig)
        os=BSD
    ;;

    CYGWIN*|MSYS*|MINGW*)
        os=Windows
    ;;

    *)
        printf '%s\n' "Unknown OS detected: '$kernel_name', aborting..." >&2
        printf '%s\n' "Open an issue on GitHub to add support for your OS." >&2
        exit 1
    ;;
esac

case $os in
    "Mac OS X"|"macOS")
        if type -p screenresolution >/dev/null; then
            resolution="$(screenresolution get 2>&1 | awk '/Display/ {printf $6 "Hz, "}')"
            resolution="${resolution//x??@/ @ }"

        else
            resolution="$(system_profiler SPDisplaysDataType |\
                          awk '/Resolution:/ {printf $2"x"$4" @ "$6"Hz, "}')"
        fi

        if [[ -e "/Library/Preferences/com.apple.windowserver.plist" ]]; then
            scale_factor="$(/usr/libexec/PlistBuddy -c "Print DisplayAnyUserSets:0:0:Resolution" \
                            /Library/Preferences/com.apple.windowserver.plist)"
        else
            scale_factor=""
        fi

        # If no refresh rate is empty.
        [[ "$resolution" == *"@ Hz"* ]] && \
            resolution="${resolution//@ Hz}"

        [[ "${scale_factor%.*}" == 2 ]] && \
            resolution="${resolution// @/@2x @}"

        if [[ "$refresh_rate" == "off" ]]; then
            resolution="${resolution// @ [0-9][0-9]Hz}"
            resolution="${resolution// @ [0-9][0-9][0-9]Hz}"
        fi

        [[ "$resolution" == *"0Hz"* ]] && \
            resolution="${resolution// @ 0Hz}"
    ;;

    "Windows")
        IFS=$'\n' read -d "" -ra sw \
            <<< "$(wmic path Win32_VideoController get CurrentHorizontalResolution)"

        IFS=$'\n' read -d "" -ra sh \
            <<< "$(wmic path Win32_VideoController get CurrentVerticalResolution)"

        sw=("${sw[@]//CurrentHorizontalResolution}")
        sh=("${sh[@]//CurrentVerticalResolution}")

        for ((mn = 0; mn < ${#sw[@]}; mn++)) {
            [[ ${sw[mn]//[[:space:]]} && ${sh[mn]//[[:space:]]} ]] &&
                resolution+="${sw[mn]//[[:space:]]}x${sh[mn]//[[:space:]]}, "
        }

        resolution=${resolution%,}
    ;;

    "Haiku")
        resolution="$(screenmode | awk -F ' |, ' 'END{printf $2 "x" $3 " @ " $6 $7}')"

        [[ "$refresh_rate" == "off" ]] && resolution="${resolution/ @*}"
    ;;

    "FreeMiNT")
        # Need to block X11 queries
    ;;

    *)
        if type -p xrandr >/dev/null && [[ $DISPLAY && -z $WAYLAND_DISPLAY ]]; then
            case $refresh_rate in
                "on")
                    resolution="$(xrandr --nograb --current |\
                                  awk 'match($0,/[0-9]*\.[0-9]*\*/) {
                                       printf $1 " @ " substr($0,RSTART,RLENGTH) "Hz, "}')"
                ;;

                "off")
                    resolution="$(xrandr --nograb --current |\
                                  awk -F 'connected |\\+|\\(' \
                                         '/ connected.*[0-9]+x[0-9]+\+/ && $2 {printf $2 ", "}')"

                    resolution="${resolution/primary, }"
                    resolution="${resolution/primary }"
                ;;
            esac
            resolution="${resolution//\*}"

        elif type -p xwininfo >/dev/null && [[ $DISPLAY && -z $WAYLAND_DISPLAY ]]; then
            read -r w h \
                <<< "$(xwininfo -root | awk -F':' '/Width|Height/ {printf $2}')"
            resolution="${w}x${h}"

        elif type -p xdpyinfo >/dev/null && [[ $DISPLAY && -z $WAYLAND_DISPLAY ]]; then
            resolution="$(xdpyinfo | awk '/dimensions:/ {printf $2}')"

        elif [[ -d /sys/class/drm ]]; then
            for dev in /sys/class/drm/*/modes; do
                read -r resolution _ < "$dev"

                [[ $resolution ]] && break
            done
        fi
    ;;
esac

resolution="${resolution%,*}"
[[ -z "${resolution/x}" ]] && resolution=

echo ${resolution}
